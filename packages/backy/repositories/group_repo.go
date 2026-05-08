package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
	"verso/backy/database/models"
)

var ErrGroupNotFound = errors.New("group not found")

// GroupRepo handles database operations for groups.
type GroupRepo struct {
	pool *pgxpool.Pool
}

// NewGroupRepo creates a new group repository using the global pool.
func NewGroupRepo() *GroupRepo {
	return &GroupRepo{pool: database.GetPool()}
}

// GetByID fetches a group by its primary key with member count.
func (r *GroupRepo) GetByID(ctx context.Context, id string) (models.Group, error) {
	query := `
		SELECT g.id, g.workspace_id, g.name, g.description, g.is_default, g.creator_id,
		       COALESCE(m.member_count, 0),
		       g.created_at::text, g.updated_at::text
		FROM groups g
		LEFT JOIN (
			SELECT group_id, COUNT(*) AS member_count
			FROM group_users
			GROUP BY group_id
		) m ON m.group_id = g.id
		WHERE g.id = $1 AND g.deleted_at IS NULL`

	var g models.Group
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&g.ID, &g.WorkspaceID, &g.Name, &g.Description, &g.IsDefault, &g.CreatorID,
		&g.MemberCount,
		&g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Group{}, ErrGroupNotFound
		}
		return models.Group{}, fmt.Errorf("querying group by id %q: %w", id, err)
	}
	return g, nil
}

// ListByWorkspace returns all non-deleted groups for a workspace ordered by name.
func (r *GroupRepo) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Group, error) {
	query := `
		SELECT g.id, g.workspace_id, g.name, g.description, g.is_default, g.creator_id,
		       COALESCE(m.member_count, 0),
		       g.created_at::text, g.updated_at::text
		FROM groups g
		LEFT JOIN (
			SELECT group_id, COUNT(*) AS member_count
			FROM group_users
			GROUP BY group_id
		) m ON m.group_id = g.id
		WHERE g.workspace_id = $1 AND g.deleted_at IS NULL
		ORDER BY g.name`

	rows, err := r.pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("listing groups: %w", err)
	}
	defer rows.Close()

	var groups []models.Group
	for rows.Next() {
		var g models.Group
		if err := rows.Scan(&g.ID, &g.WorkspaceID, &g.Name, &g.Description, &g.IsDefault, &g.CreatorID,
			&g.MemberCount, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning group row: %w", err)
		}
		groups = append(groups, g)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating group rows: %w", err)
	}
	if groups == nil {
		groups = []models.Group{}
	}
	return groups, nil
}

// Insert creates a new group row.
func (r *GroupRepo) Insert(ctx context.Context, g models.Group) error {
	query := `
		INSERT INTO groups (id, workspace_id, name, description, is_default, creator_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, now(), now())`

	_, err := r.pool.Exec(ctx, query, g.ID, g.WorkspaceID, g.Name, g.Description, g.IsDefault, g.CreatorID)
	if err != nil {
		return fmt.Errorf("inserting group %q: %w", g.Name, err)
	}
	return nil
}

// InsertTx creates a new group row within a transaction.
func (r *GroupRepo) InsertTx(ctx context.Context, tx pgx.Tx, g models.Group) error {
	query := `
		INSERT INTO groups (id, workspace_id, name, description, is_default, creator_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, now(), now())`

	_, err := tx.Exec(ctx, query, g.ID, g.WorkspaceID, g.Name, g.Description, g.IsDefault, g.CreatorID)
	if err != nil {
		return fmt.Errorf("inserting group %q: %w", g.Name, err)
	}
	return nil
}

// Update modifies an existing group row (name and description only; is_default is immutable).
func (r *GroupRepo) Update(ctx context.Context, g models.Group) error {
	query := `
		UPDATE groups SET name = $1, description = $2, updated_at = now()
		WHERE id = $3 AND deleted_at IS NULL AND is_default = false`

	tag, err := r.pool.Exec(ctx, query, g.Name, g.Description, g.ID)
	if err != nil {
		return fmt.Errorf("updating group %q: %w", g.ID, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: group %q (may be default or deleted)", ErrGroupNotFound, g.ID)
	}
	return nil
}

// SoftDelete marks a non-default group as deleted.
func (r *GroupRepo) SoftDelete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE groups SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL AND is_default = false`, id)
	if err != nil {
		return fmt.Errorf("soft-deleting group %q: %w", id, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: group %q (may be default or already deleted)", ErrGroupNotFound, id)
	}
	return nil
}

// GetDefaultGroupID returns the ID of the default group for a workspace.
func (r *GroupRepo) GetDefaultGroupID(ctx context.Context, workspaceID string) (string, error) {
	var id string
	err := r.pool.QueryRow(
		ctx,
		`SELECT id FROM groups WHERE workspace_id = $1 AND is_default = true AND deleted_at IS NULL`,
		workspaceID,
	).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrGroupNotFound
		}
		return "", fmt.Errorf("getting default group for workspace %q: %w", workspaceID, err)
	}
	return id, nil
}

// --- Group Membership ---

// AddUser adds a user to a group.
func (r *GroupRepo) AddUser(ctx context.Context, groupID, userID string) error {
	query := `
		INSERT INTO group_users (group_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (group_id, user_id) DO NOTHING`
	_, err := r.pool.Exec(ctx, query, groupID, userID)
	if err != nil {
		return fmt.Errorf("adding user to group %q: %w", groupID, err)
	}
	return nil
}

// AddUserTx adds a user to a group within a transaction.
func (r *GroupRepo) AddUserTx(ctx context.Context, tx pgx.Tx, groupID, userID string) error {
	query := `
		INSERT INTO group_users (group_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (group_id, user_id) DO NOTHING`
	_, err := tx.Exec(ctx, query, groupID, userID)
	if err != nil {
		return fmt.Errorf("adding user to group %q: %w", groupID, err)
	}
	return nil
}

// RemoveUser removes a user from a group.
func (r *GroupRepo) RemoveUser(ctx context.Context, groupID, userID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM group_users WHERE group_id = $1 AND user_id = $2`, groupID, userID)
	if err != nil {
		return fmt.Errorf("removing user from group %q: %w", groupID, err)
	}
	return nil
}

// IsUserInGroup checks if a user is in a group.
func (r *GroupRepo) IsUserInGroup(ctx context.Context, groupID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(
		ctx,
		`SELECT EXISTS(SELECT 1 FROM group_users WHERE group_id = $1 AND user_id = $2)`,
		groupID, userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking group membership: %w", err)
	}
	return exists, nil
}

// GetMembersWithUsers returns all members of a group enriched with user details.
func (r *GroupRepo) GetMembersWithUsers(ctx context.Context, groupID string) ([]models.GroupMemberWithUser, error) {
	query := `
		SELECT gu.id, gu.user_id, gu.group_id,
		       COALESCE(u.name, ''), COALESCE(u.email, ''), COALESCE(u.avatar_url, ''),
		       gu.added_at::text
		FROM group_users gu
		JOIN users u ON u.id = gu.user_id
		WHERE gu.group_id = $1
		ORDER BY gu.added_at DESC`

	rows, err := r.pool.Query(ctx, query, groupID)
	if err != nil {
		return nil, fmt.Errorf("listing group members: %w", err)
	}
	defer rows.Close()

	var members []models.GroupMemberWithUser
	for rows.Next() {
		var m models.GroupMemberWithUser
		if err := rows.Scan(&m.ID, &m.UserID, &m.GroupID,
			&m.Name, &m.Email, &m.AvatarURL, &m.AddedAt); err != nil {
			return nil, fmt.Errorf("scanning group member: %w", err)
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating group members: %w", err)
	}
	if members == nil {
		members = []models.GroupMemberWithUser{}
	}
	return members, nil
}

// ListUserGroupIDsInWorkspace returns all group IDs a user belongs to in a workspace.
func (r *GroupRepo) ListUserGroupIDsInWorkspace(ctx context.Context, userID, workspaceID string) ([]string, error) {
	query := `
		SELECT g.id
		FROM groups g
		JOIN group_users gu ON gu.group_id = g.id
		WHERE g.workspace_id = $1 AND gu.user_id = $2 AND g.deleted_at IS NULL`

	rows, err := r.pool.Query(ctx, query, workspaceID, userID)
	if err != nil {
		return nil, fmt.Errorf("listing user groups: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scanning group id: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}
