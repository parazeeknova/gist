package repositories

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
	"verso/backy/database/models"
)

// MFARepo handles database operations for user MFA.
type MFARepo struct {
	pool *pgxpool.Pool
}

// NewMFARepo creates a new MFARepo.
func NewMFARepo() *MFARepo {
	return &MFARepo{pool: database.GetPool()}
}

// GetByUserID retrieves MFA config for a user.
func (r *MFARepo) GetByUserID(ctx context.Context, userID string) (*models.UserMFA, error) {
	query := `
		SELECT id, user_id, COALESCE(workspace_id::text, ''), method, secret, is_enabled,
		       COALESCE(backup_code_hashes, '{}'),
		       COALESCE(to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		       COALESCE(to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
		FROM user_mfa
		WHERE user_id = $1`

	var m models.UserMFA
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&m.ID, &m.UserID, &m.WorkspaceID, &m.Method, &m.Secret, &m.IsEnabled,
		&m.BackupCodeHashes, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get mfa by user id: %w", err)
	}
	return &m, nil
}

// Upsert creates or updates MFA config for a user.
func (r *MFARepo) Upsert(ctx context.Context, userID, workspaceID, method, secret string, isEnabled bool, backupCodeHashes []string) error {
	query := `
		INSERT INTO user_mfa (user_id, workspace_id, method, secret, is_enabled, backup_code_hashes)
		VALUES ($1, NULLIF($2, '')::uuid, $3, $4, $5, $6)
		ON CONFLICT (user_id)
		DO UPDATE SET
			workspace_id = EXCLUDED.workspace_id,
			method = EXCLUDED.method,
			secret = EXCLUDED.secret,
			is_enabled = EXCLUDED.is_enabled,
			backup_code_hashes = EXCLUDED.backup_code_hashes,
			updated_at = NOW()`

	_, err := r.pool.Exec(ctx, query, userID, workspaceID, method, secret, isEnabled, backupCodeHashes)
	if err != nil {
		return fmt.Errorf("upsert mfa: %w", err)
	}
	return nil
}

// UpdateSecret updates only the secret for a user.
func (r *MFARepo) UpdateSecret(ctx context.Context, userID, secret string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE user_mfa SET secret = $1, updated_at = NOW() WHERE user_id = $2`,
		secret, userID,
	)
	if err != nil {
		return fmt.Errorf("update mfa secret: %w", err)
	}
	return nil
}

// Enable enables MFA for a user.
func (r *MFARepo) Enable(ctx context.Context, userID string, backupCodeHashes []string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE user_mfa SET is_enabled = true, backup_code_hashes = $1, updated_at = NOW() WHERE user_id = $2`,
		backupCodeHashes, userID,
	)
	if err != nil {
		return fmt.Errorf("enable mfa: %w", err)
	}
	return nil
}

// Disable disables MFA for a user and clears the secret.
func (r *MFARepo) Disable(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE user_mfa SET is_enabled = false, secret = '', backup_code_hashes = '{}', updated_at = NOW() WHERE user_id = $1`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("disable mfa: %w", err)
	}
	return nil
}

// UpdateBackupCodes updates backup codes for a user.
func (r *MFARepo) UpdateBackupCodes(ctx context.Context, userID string, backupCodeHashes []string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE user_mfa SET backup_code_hashes = $1, updated_at = NOW() WHERE user_id = $2`,
		backupCodeHashes, userID,
	)
	if err != nil {
		return fmt.Errorf("update backup codes: %w", err)
	}
	return nil
}

// Delete removes MFA config for a user.
func (r *MFARepo) Delete(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM user_mfa WHERE user_id = $1`, userID)
	if err != nil {
		return fmt.Errorf("delete mfa: %w", err)
	}
	return nil
}
