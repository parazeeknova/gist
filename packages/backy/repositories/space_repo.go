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

var (
	ErrSpaceNotFound = errors.New("space not found")
	ErrSpaceNotEmpty = errors.New("space is not empty")
)

// SpaceRepo handles database operations for spaces
type SpaceRepo struct {
	pool *pgxpool.Pool
}

// NewSpaceRepo creates a new space repository using the global pool.
func NewSpaceRepo() *SpaceRepo {
	return &SpaceRepo{pool: database.GetPool()}
}

// ListByIDs fetches spaces matching the given IDs (preserving input order) with member counts.
// Only returns non-deleted spaces. Does not return errors for missing IDs.
func (r *SpaceRepo) ListByIDs(ctx context.Context, ids []string) ([]models.Space, error) {
	if len(ids) == 0 {
		return []models.Space{}, nil
	}

	query := `
		SELECT s.id, s.name, s.slug, s.icon, s.description, s.header_image, s.workspace_id, s.created_by,
		       s.visibility, s.default_role, s.settings,
		       COALESCE(m.member_count, 0),
		       s.created_at::text, s.updated_at::text
		FROM spaces s
		LEFT JOIN (
			SELECT space_id, COUNT(*) AS member_count
			FROM space_members
			GROUP BY space_id
		) m ON m.space_id = s.id
		WHERE s.id = ANY($1::text[]) AND s.deleted_at IS NULL
		ORDER BY array_position($1::text[], s.id)`

	rows, err := r.pool.Query(ctx, query, ids)
	if err != nil {
		return nil, fmt.Errorf("querying spaces by ids: %w", err)
	}
	defer rows.Close()

	var spaces []models.Space
	for rows.Next() {
		var s models.Space
		if err := rows.Scan(&s.ID, &s.Name, &s.Slug, &s.Icon, &s.Description, &s.HeaderImage, &s.WorkspaceID, &s.CreatedBy,
			&s.Visibility, &s.DefaultRole, &s.Settings,
			&s.MemberCount, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning space row: %w", err)
		}
		spaces = append(spaces, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating space rows: %w", err)
	}

	if spaces == nil {
		spaces = []models.Space{}
	}
	return spaces, nil
}

// GetByID fetches a space by its primary key with member count.
func (r *SpaceRepo) GetByID(ctx context.Context, id string) (models.Space, error) {
	query := `
		SELECT s.id, s.name, s.slug, s.icon, s.description, s.header_image, s.workspace_id, s.created_by,
		       s.visibility, s.default_role, s.settings,
		       COALESCE(m.member_count, 0),
		       s.created_at::text, s.updated_at::text
		FROM spaces s
		LEFT JOIN (
			SELECT space_id, COUNT(*) AS member_count
			FROM space_members
			GROUP BY space_id
		) m ON m.space_id = s.id
		WHERE s.id = $1 AND s.deleted_at IS NULL`

	var s models.Space
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.Name, &s.Slug, &s.Icon, &s.Description, &s.HeaderImage, &s.WorkspaceID, &s.CreatedBy,
		&s.Visibility, &s.DefaultRole, &s.Settings,
		&s.MemberCount,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Space{}, ErrSpaceNotFound
		}
		return models.Space{}, fmt.Errorf("querying space by id %q: %w", id, err)
	}
	return s, nil
}

// GetBySlug fetches a space by its slug with member count.
func (r *SpaceRepo) GetBySlug(ctx context.Context, slug string) (models.Space, error) {
	query := `
		SELECT s.id, s.name, s.slug, s.icon, s.description, s.header_image, s.workspace_id, s.created_by,
		       s.visibility, s.default_role, s.settings,
		       COALESCE(m.member_count, 0),
		       s.created_at::text, s.updated_at::text
		FROM spaces s
		LEFT JOIN (
			SELECT space_id, COUNT(*) AS member_count
			FROM space_members
			GROUP BY space_id
		) m ON m.space_id = s.id
		WHERE s.slug = $1 AND s.deleted_at IS NULL`

	var s models.Space
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&s.ID, &s.Name, &s.Slug, &s.Icon, &s.Description, &s.HeaderImage, &s.WorkspaceID, &s.CreatedBy,
		&s.Visibility, &s.DefaultRole, &s.Settings,
		&s.MemberCount,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Space{}, ErrSpaceNotFound
		}
		return models.Space{}, fmt.Errorf("querying space by slug %q: %w", slug, err)
	}
	return s, nil
}

// GetDefaultSpaceID returns the ID of the first space (ordered by created_at).
// This is used when no workspace context is available; prefer getting the default
// space ID from the workspace's default_space_id field when possible.
func (r *SpaceRepo) GetDefaultSpaceID(ctx context.Context) (string, error) {
	query := `SELECT id FROM spaces WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`
	var id string
	err := r.pool.QueryRow(ctx, query).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrSpaceNotFound
		}
		return "", fmt.Errorf("getting default space id: %w", err)
	}
	return id, nil
}

// ListAll returns all spaces for a workspace ordered by name with member counts.
func (r *SpaceRepo) ListAll(ctx context.Context, workspaceID string) ([]models.Space, error) {
	query := `
		SELECT s.id, s.name, s.slug, s.icon, s.description, s.header_image, s.workspace_id, s.created_by,
		       s.visibility, s.default_role, s.settings,
		       COALESCE(m.member_count, 0),
		       s.created_at::text, s.updated_at::text
		FROM spaces s
		LEFT JOIN (
			SELECT space_id, COUNT(*) AS member_count
			FROM space_members
			GROUP BY space_id
		) m ON m.space_id = s.id
		WHERE s.workspace_id = $1 AND s.deleted_at IS NULL
		ORDER BY s.name`

	rows, err := r.pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("listing spaces: %w", err)
	}
	defer rows.Close()

	var spaces []models.Space
	for rows.Next() {
		var s models.Space
		if err := rows.Scan(&s.ID, &s.Name, &s.Slug, &s.Icon, &s.Description, &s.HeaderImage, &s.WorkspaceID, &s.CreatedBy,
			&s.Visibility, &s.DefaultRole, &s.Settings,
			&s.MemberCount, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning space row: %w", err)
		}
		spaces = append(spaces, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating space rows: %w", err)
	}

	if spaces == nil {
		spaces = []models.Space{}
	}
	return spaces, nil
}

// Insert creates a new space row.
func (r *SpaceRepo) Insert(ctx context.Context, s models.Space) error {
	query := `
		INSERT INTO spaces (id, name, slug, icon, description, header_image, workspace_id, created_by, visibility, default_role, settings, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`

	_, err := r.pool.Exec(ctx, query, s.ID, s.Name, s.Slug, s.Icon, s.Description, s.HeaderImage, s.WorkspaceID, s.CreatedBy, s.Visibility, s.DefaultRole, s.Settings)
	if err != nil {
		return fmt.Errorf("inserting space %q: %w", s.Slug, err)
	}
	return nil
}

// InsertTx creates a new space row within a transaction.
func (r *SpaceRepo) InsertTx(ctx context.Context, tx pgx.Tx, s models.Space) error {
	query := `
		INSERT INTO spaces (id, name, slug, icon, description, header_image, workspace_id, created_by, visibility, default_role, settings, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`

	_, err := tx.Exec(ctx, query, s.ID, s.Name, s.Slug, s.Icon, s.Description, s.HeaderImage, s.WorkspaceID, s.CreatedBy, s.Visibility, s.DefaultRole, s.Settings)
	if err != nil {
		return fmt.Errorf("inserting space %q: %w", s.Slug, err)
	}
	return nil
}

// Update modifies an existing space row.
func (r *SpaceRepo) Update(ctx context.Context, s models.Space) error {
	query := `
		UPDATE spaces SET name = $1, slug = $2, icon = $3, description = $4, header_image = $5, visibility = $6, default_role = $7, settings = $8, updated_at = now()
		WHERE id = $9 AND deleted_at IS NULL`

	tag, err := r.pool.Exec(ctx, query, s.Name, s.Slug, s.Icon, s.Description, s.HeaderImage, s.Visibility, s.DefaultRole, s.Settings, s.ID)
	if err != nil {
		return fmt.Errorf("updating space %q: %w", s.ID, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: space %q", ErrSpaceNotFound, s.ID)
	}
	return nil
}

// SoftDelete marks a space as deleted.
func (r *SpaceRepo) SoftDelete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `UPDATE spaces SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return fmt.Errorf("soft-deleting space %q: %w", id, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: space %q", ErrSpaceNotFound, id)
	}
	return nil
}

// PageCount returns the number of non-deleted pages in a space.
func (r *SpaceRepo) PageCount(ctx context.Context, spaceID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM pages WHERE space_id = $1 AND deleted_at IS NULL`, spaceID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting pages in space %q: %w", spaceID, err)
	}
	return count, nil
}

// --- Space Membership ---

// AddMember adds a user to a space with a given role.
func (r *SpaceRepo) AddMember(ctx context.Context, spaceID, userID, role string) error {
	query := `
		INSERT INTO space_members (space_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (space_id, user_id) WHERE user_id IS NOT NULL DO UPDATE SET role = EXCLUDED.role`
	_, err := r.pool.Exec(ctx, query, spaceID, userID, role)
	if err != nil {
		return fmt.Errorf("adding member to space %q: %w", spaceID, err)
	}
	return nil
}

// AddMemberTx adds a user to a space with a given role within a transaction.
func (r *SpaceRepo) AddMemberTx(ctx context.Context, tx pgx.Tx, spaceID, userID, role string) error {
	query := `
		INSERT INTO space_members (space_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (space_id, user_id) WHERE user_id IS NOT NULL DO UPDATE SET role = EXCLUDED.role`
	_, err := tx.Exec(ctx, query, spaceID, userID, role)
	if err != nil {
		return fmt.Errorf("adding member to space %q: %w", spaceID, err)
	}
	return nil
}

// AddGroupMember adds a group to a space with a given role.
func (r *SpaceRepo) AddGroupMember(ctx context.Context, spaceID, groupID, role string) error {
	query := `
		INSERT INTO space_members (space_id, group_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (space_id, group_id) WHERE group_id IS NOT NULL DO UPDATE SET role = EXCLUDED.role`
	_, err := r.pool.Exec(ctx, query, spaceID, groupID, role)
	if err != nil {
		return fmt.Errorf("adding group to space %q: %w", spaceID, err)
	}
	return nil
}

// AddGroupMemberTx adds a group to a space with a given role within a transaction.
func (r *SpaceRepo) AddGroupMemberTx(ctx context.Context, tx pgx.Tx, spaceID, groupID, role string) error {
	query := `
		INSERT INTO space_members (space_id, group_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (space_id, group_id) WHERE group_id IS NOT NULL DO UPDATE SET role = EXCLUDED.role`
	_, err := tx.Exec(ctx, query, spaceID, groupID, role)
	if err != nil {
		return fmt.Errorf("adding group to space %q: %w", spaceID, err)
	}
	return nil
}

// GetMemberRole returns a user's direct role in a space, or empty string if not a direct member.
func (r *SpaceRepo) GetMemberRole(ctx context.Context, spaceID, userID string) (string, error) {
	var role string
	err := r.pool.QueryRow(
		ctx,
		`SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2`,
		spaceID, userID,
	).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", fmt.Errorf("getting member role: %w", err)
	}
	return role, nil
}

// GetEffectiveRole returns the highest role a user has in a space through direct or group membership.
// Priority: admin > writer > reader.
func (r *SpaceRepo) GetEffectiveRole(ctx context.Context, spaceID, userID string, groupIDs []string) (string, error) {
	// Check direct membership first.
	directRole, err := r.GetMemberRole(ctx, spaceID, userID)
	if err != nil {
		return "", err
	}
	if directRole == models.SpaceRoleAdmin {
		return models.SpaceRoleAdmin, nil
	}

	// Check group-derived roles.
	var groupRole string
	if len(groupIDs) > 0 {
		query := `
			SELECT role FROM space_members
			WHERE space_id = $1 AND group_id = ANY($2::uuid[])
			ORDER BY CASE role
				WHEN 'admin' THEN 1
				WHEN 'writer' THEN 2
				WHEN 'reader' THEN 3
			END
			LIMIT 1`
		err := r.pool.QueryRow(ctx, query, spaceID, groupIDs).Scan(&groupRole)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return "", fmt.Errorf("getting group role: %w", err)
		}
	}

	// Pick the highest role.
	roles := []string{directRole, groupRole}
	for _, r := range []string{models.SpaceRoleAdmin, models.SpaceRoleWriter, models.SpaceRoleReader} {
		for _, role := range roles {
			if role == r {
				return r, nil
			}
		}
	}
	return "", nil
}

// IsMember checks if a user is a member of a space.
func (r *SpaceRepo) IsMember(ctx context.Context, spaceID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(
		ctx,
		`SELECT EXISTS(SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2)`,
		spaceID, userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking membership: %w", err)
	}
	return exists, nil
}

// RemoveMember removes a user from a space.
func (r *SpaceRepo) RemoveMember(ctx context.Context, spaceID, userID string) error {
	_, err := r.pool.Exec(
		ctx,
		`DELETE FROM space_members WHERE space_id = $1 AND user_id = $2`,
		spaceID, userID,
	)
	if err != nil {
		return fmt.Errorf("removing member from space %q: %w", spaceID, err)
	}
	return nil
}

// GetMemberCount returns the number of members in a space.
func (r *SpaceRepo) GetMemberCount(ctx context.Context, spaceID string) (int, error) {
	var count int
	err := r.pool.QueryRow(
		ctx,
		`SELECT COUNT(*) FROM space_members WHERE space_id = $1`, spaceID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting space members: %w", err)
	}
	return count, nil
}

// GetMembersWithUsers returns all members of a space enriched with user details.
func (r *SpaceRepo) GetMembersWithUsers(ctx context.Context, spaceID string) ([]models.SpaceMemberWithUser, error) {
	query := `
		SELECT sm.id, sm.user_id, sm.space_id, sm.role, sm.joined_at::text,
		       COALESCE(u.name, ''), COALESCE(u.email, ''), COALESCE(u.avatar_url, '')
		FROM space_members sm
		JOIN users u ON u.id = sm.user_id
		WHERE sm.space_id = $1
		ORDER BY sm.joined_at DESC`

	rows, err := r.pool.Query(ctx, query, spaceID)
	if err != nil {
		return nil, fmt.Errorf("listing space members with users: %w", err)
	}
	defer rows.Close()

	var members []models.SpaceMemberWithUser
	for rows.Next() {
		var m models.SpaceMemberWithUser
		if err := rows.Scan(&m.ID, &m.UserID, &m.SpaceID, &m.Role, &m.JoinedAt,
			&m.Name, &m.Email, &m.AvatarURL); err != nil {
			return nil, fmt.Errorf("scanning space member with user: %w", err)
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating space members with users: %w", err)
	}
	if members == nil {
		members = []models.SpaceMemberWithUser{}
	}
	return members, nil
}

// GetMembersMixed returns all members of a space as a mixed collection of users and groups.
func (r *SpaceRepo) GetMembersMixed(ctx context.Context, spaceID string) ([]models.SpaceMemberMixed, error) {
	query := `
		SELECT 'user', sm.id, sm.user_id, NULL::uuid, sm.space_id, sm.role, sm.joined_at::text,
		       COALESCE(u.name, ''), COALESCE(u.email, ''), COALESCE(u.avatar_url, ''),
		       NULL::text, NULL::int, NULL::bool
		FROM space_members sm
		JOIN users u ON u.id = sm.user_id
		WHERE sm.space_id = $1
		UNION ALL
		SELECT 'group', sm.id, NULL::uuid, sm.group_id, sm.space_id, sm.role, sm.joined_at::text,
		       g.name, NULL::text, NULL::text,
		       COALESCE(g.description, ''), (SELECT COUNT(*) FROM group_users gu WHERE gu.group_id = g.id),
		       g.is_default
		FROM space_members sm
		JOIN groups g ON g.id = sm.group_id
		WHERE sm.space_id = $1
		ORDER BY 7 DESC`

	rows, err := r.pool.Query(ctx, query, spaceID)
	if err != nil {
		return nil, fmt.Errorf("listing mixed space members: %w", err)
	}
	defer rows.Close()

	var members []models.SpaceMemberMixed
	for rows.Next() {
		var m models.SpaceMemberMixed
		var memberCount *int
		if err := rows.Scan(&m.MemberType, &m.ID, &m.UserID, &m.GroupID, &m.SpaceID, &m.Role, &m.JoinedAt,
			&m.Name, &m.Email, &m.AvatarURL, &m.Description, &memberCount, &m.IsDefault); err != nil {
			return nil, fmt.Errorf("scanning mixed space member: %w", err)
		}
		if memberCount != nil {
			m.MemberCount = *memberCount
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating mixed space members: %w", err)
	}
	if members == nil {
		members = []models.SpaceMemberMixed{}
	}
	return members, nil
}

// UpdateGroupMemberRole updates a group's role in a space.
func (r *SpaceRepo) UpdateGroupMemberRole(ctx context.Context, spaceID, groupID, role string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE space_members SET role = $1 WHERE space_id = $2 AND group_id = $3`,
		role, spaceID, groupID)
	if err != nil {
		return fmt.Errorf("updating group member role: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("group %q is not a member of space %q", groupID, spaceID)
	}
	return nil
}

// RemoveGroupMember removes a group from a space.
func (r *SpaceRepo) RemoveGroupMember(ctx context.Context, spaceID, groupID string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM space_members WHERE space_id = $1 AND group_id = $2`,
		spaceID, groupID)
	if err != nil {
		return fmt.Errorf("removing group from space %q: %w", spaceID, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("group %q is not a member of space %q", groupID, spaceID)
	}
	return nil
}

// GetMembers returns all members of a space.
func (r *SpaceRepo) GetMembers(ctx context.Context, spaceID string) ([]models.SpaceMember, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, user_id, space_id, role, joined_at::text FROM space_members WHERE space_id = $1`,
		spaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing space members: %w", err)
	}
	defer rows.Close()

	var members []models.SpaceMember
	for rows.Next() {
		var m models.SpaceMember
		if err := rows.Scan(&m.ID, &m.UserID, &m.SpaceID, &m.Role, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("scanning space member: %w", err)
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating space members: %w", err)
	}
	if members == nil {
		members = []models.SpaceMember{}
	}
	return members, nil
}

// UpdateMemberRole updates a user's role in a space.
func (r *SpaceRepo) UpdateMemberRole(ctx context.Context, spaceID, userID, role string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE space_members SET role = $1 WHERE space_id = $2 AND user_id = $3`,
		role, spaceID, userID,
	)
	if err != nil {
		return fmt.Errorf("updating member role: %w", err)
	}
	return nil
}

// HasAdminOtherThan checks if there's another admin besides the given user.
func (r *SpaceRepo) HasAdminOtherThan(ctx context.Context, spaceID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(
		ctx,
		`SELECT EXISTS(SELECT 1 FROM space_members WHERE space_id = $1 AND user_id != $2 AND role = 'admin')`,
		spaceID, userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking other admins: %w", err)
	}
	return exists, nil
}

// ListWorkspaceMemberIDs returns all user IDs that are members of a workspace.
func (r *SpaceRepo) ListWorkspaceMemberIDs(ctx context.Context, workspaceID string) ([]string, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT user_id FROM workspace_members WHERE workspace_id = $1`,
		workspaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing workspace member IDs: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scanning member ID: %w", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating member IDs: %w", err)
	}
	return ids, nil
}
