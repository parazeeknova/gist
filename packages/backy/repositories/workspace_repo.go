package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
	"verso/backy/models"
)

var (
	ErrWorkspaceNotFound = errors.New("workspace not found")
	ErrWorkspaceNotEmpty = errors.New("workspace is not empty")
)

// WorkspaceRepo handles database operations for workspaces
type WorkspaceRepo struct {
	pool *pgxpool.Pool
}

// NewWorkspaceRepo creates a new workspace repository using the global pool.
func NewWorkspaceRepo() *WorkspaceRepo {
	return &WorkspaceRepo{pool: database.GetPool()}
}

// GetByID fetches a workspace by its primary key with member count.
func (r *WorkspaceRepo) GetByID(ctx context.Context, id string) (models.Workspace, error) {
	query := `
		SELECT w.id, w.name, w.slug, w.icon, w.description, w.settings, COALESCE(w.default_space_id::text, ''), w.enforce_mfa,
		       COALESCE(m.member_count, 0),
		       w.created_at::text, w.updated_at::text
		FROM workspaces w
		LEFT JOIN (
			SELECT workspace_id, COUNT(*) AS member_count
			FROM workspace_members
			GROUP BY workspace_id
		) m ON m.workspace_id = w.id
		WHERE w.id = $1 AND w.deleted_at IS NULL`

	var w models.Workspace
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&w.ID, &w.Name, &w.Slug, &w.Icon, &w.Description, &w.Settings, &w.DefaultSpaceID,
		&w.EnforceMFA,
		&w.MemberCount,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Workspace{}, ErrWorkspaceNotFound
		}
		return models.Workspace{}, fmt.Errorf("querying workspace by id %q: %w", id, err)
	}
	return w, nil
}

// GetDefaultWorkspaceID returns the ID of the default "personal" workspace.
func (r *WorkspaceRepo) GetDefaultWorkspaceID(ctx context.Context) (string, error) {
	query := `SELECT id FROM workspaces WHERE slug = 'personal' AND deleted_at IS NULL LIMIT 1`
	var id string
	err := r.pool.QueryRow(ctx, query).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrWorkspaceNotFound
		}
		return "", fmt.Errorf("getting default workspace id: %w", err)
	}
	return id, nil
}

// ListAll returns all non-deleted workspaces ordered by name with member counts.
func (r *WorkspaceRepo) ListAll(ctx context.Context) ([]models.Workspace, error) {
	query := `
		SELECT w.id, w.name, w.slug, w.icon, w.description, w.settings, COALESCE(w.default_space_id::text, ''), w.enforce_mfa,
		       COALESCE(m.member_count, 0),
		       w.created_at::text, w.updated_at::text
		FROM workspaces w
		LEFT JOIN (
			SELECT workspace_id, COUNT(*) AS member_count
			FROM workspace_members
			GROUP BY workspace_id
		) m ON m.workspace_id = w.id
		WHERE w.deleted_at IS NULL
		ORDER BY w.name`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing workspaces: %w", err)
	}
	defer rows.Close()

	var workspaces []models.Workspace
	for rows.Next() {
		var w models.Workspace
		if err := rows.Scan(&w.ID, &w.Name, &w.Slug, &w.Icon, &w.Description, &w.Settings, &w.DefaultSpaceID, &w.EnforceMFA,
			&w.MemberCount, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning workspace row: %w", err)
		}
		workspaces = append(workspaces, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating workspace rows: %w", err)
	}

	if workspaces == nil {
		workspaces = []models.Workspace{}
	}
	return workspaces, nil
}

// Insert creates a new workspace row.
func (r *WorkspaceRepo) Insert(ctx context.Context, w models.Workspace) error {
	query := `
		INSERT INTO workspaces (id, name, slug, icon, description, settings, enforce_mfa, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`

	_, err := r.pool.Exec(ctx, query, w.ID, w.Name, w.Slug, w.Icon, w.Description, w.Settings, w.EnforceMFA)
	if err != nil {
		return fmt.Errorf("inserting workspace %q: %w", w.Slug, err)
	}
	return nil
}

// Update modifies an existing workspace row.
func (r *WorkspaceRepo) Update(ctx context.Context, w models.Workspace) error {
	query := `
		UPDATE workspaces SET name = $1, slug = $2, icon = $3, description = $4, settings = $5, default_space_id = $6, enforce_mfa = $7, updated_at = now()
		WHERE id = $8 AND deleted_at IS NULL`

	tag, err := r.pool.Exec(ctx, query, w.Name, w.Slug, w.Icon, w.Description, w.Settings, w.DefaultSpaceID, w.EnforceMFA, w.ID)
	if err != nil {
		return fmt.Errorf("updating workspace %q: %w", w.ID, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: workspace %q", ErrWorkspaceNotFound, w.ID)
	}
	return nil
}

// SoftDelete marks a workspace as deleted.
func (r *WorkspaceRepo) SoftDelete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `UPDATE workspaces SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return fmt.Errorf("soft-deleting workspace %q: %w", id, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: workspace %q", ErrWorkspaceNotFound, id)
	}
	return nil
}

// SetDefaultSpaceID updates the default space for a workspace.
func (r *WorkspaceRepo) SetDefaultSpaceID(ctx context.Context, workspaceID, spaceID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE workspaces SET default_space_id = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL`,
		spaceID, workspaceID,
	)
	if err != nil {
		return fmt.Errorf("setting default space for workspace %q: %w", workspaceID, err)
	}
	return nil
}

// SpaceCount returns the number of non-deleted spaces in a workspace.
func (r *WorkspaceRepo) SpaceCount(ctx context.Context, workspaceID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM spaces WHERE workspace_id = $1 AND deleted_at IS NULL`, workspaceID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting spaces in workspace %q: %w", workspaceID, err)
	}
	return count, nil
}

// --- Workspace Membership ---

// AddMember adds a user to a workspace with a given role.
func (r *WorkspaceRepo) AddMember(ctx context.Context, workspaceID, userID, role string) error {
	query := `
		INSERT INTO workspace_members (workspace_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, workspace_id) DO UPDATE SET role = EXCLUDED.role`
	_, err := r.pool.Exec(ctx, query, workspaceID, userID, role)
	if err != nil {
		return fmt.Errorf("adding member to workspace %q: %w", workspaceID, err)
	}
	return nil
}

// GetMemberRole returns a user's role in a workspace, or empty string if not a member.
func (r *WorkspaceRepo) GetMemberRole(ctx context.Context, workspaceID, userID string) (string, error) {
	var role string
	err := r.pool.QueryRow(ctx,
		`SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
		workspaceID, userID,
	).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", fmt.Errorf("getting member role: %w", err)
	}
	return role, nil
}

// IsMember checks if a user is a member of a workspace.
func (r *WorkspaceRepo) IsMember(ctx context.Context, workspaceID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2)`,
		workspaceID, userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking membership: %w", err)
	}
	return exists, nil
}

// RemoveMember removes a user from a workspace.
func (r *WorkspaceRepo) RemoveMember(ctx context.Context, workspaceID, userID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
		workspaceID, userID,
	)
	if err != nil {
		return fmt.Errorf("removing member from workspace %q: %w", workspaceID, err)
	}
	return nil
}

// GetMemberCount returns the number of members in a workspace.
func (r *WorkspaceRepo) GetMemberCount(ctx context.Context, workspaceID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1`, workspaceID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting workspace members: %w", err)
	}
	return count, nil
}

// GetMembers returns all members of a workspace.
func (r *WorkspaceRepo) GetMembers(ctx context.Context, workspaceID string) ([]models.WorkspaceMember, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, workspace_id, role, joined_at::text FROM workspace_members WHERE workspace_id = $1`,
		workspaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing workspace members: %w", err)
	}
	defer rows.Close()

	var members []models.WorkspaceMember
	for rows.Next() {
		var m models.WorkspaceMember
		if err := rows.Scan(&m.ID, &m.UserID, &m.WorkspaceID, &m.Role, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("scanning workspace member: %w", err)
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating workspace members: %w", err)
	}
	if members == nil {
		members = []models.WorkspaceMember{}
	}
	return members, nil
}

// HasOwnerOtherThan checks if there's another owner besides the given user.
func (r *WorkspaceRepo) HasOwnerOtherThan(ctx context.Context, workspaceID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id != $2 AND role = 'owner')`,
		workspaceID, userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking other owners: %w", err)
	}
	return exists, nil
}

// ListByUser returns all workspaces a user is a member of.
func (r *WorkspaceRepo) ListByUser(ctx context.Context, userID string) ([]models.Workspace, error) {
	query := `
		SELECT w.id, w.name, w.slug, w.icon, w.description, w.settings, COALESCE(w.default_space_id::text, ''), w.enforce_mfa,
		       COALESCE(m2.member_count, 0),
		       w.created_at::text, w.updated_at::text
		FROM workspaces w
		JOIN workspace_members wm ON wm.workspace_id = w.id
		LEFT JOIN (
			SELECT workspace_id, COUNT(*) AS member_count
			FROM workspace_members
			GROUP BY workspace_id
		) m2 ON m2.workspace_id = w.id
		WHERE wm.user_id = $1 AND w.deleted_at IS NULL
		ORDER BY w.name`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("listing user workspaces: %w", err)
	}
	defer rows.Close()

	var workspaces []models.Workspace
	for rows.Next() {
		var w models.Workspace
		if err := rows.Scan(&w.ID, &w.Name, &w.Slug, &w.Icon, &w.Description, &w.Settings, &w.DefaultSpaceID, &w.EnforceMFA,
			&w.MemberCount, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning workspace row: %w", err)
		}
		workspaces = append(workspaces, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating workspace rows: %w", err)
	}
	if workspaces == nil {
		workspaces = []models.Workspace{}
	}
	return workspaces, nil
}
