package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/verso/backy/database"
	"github.com/verso/backy/models"
)

// SessionRepo handles database operations for the sessions and refresh_tokens tables.
type SessionRepo struct {
	pool *pgxpool.Pool
}

// NewSessionRepo creates a new SessionRepo using the global database pool.
func NewSessionRepo() *SessionRepo {
	return &SessionRepo{pool: database.GetPool()}
}

// CreateSession inserts a new session row and returns the session ID.
func (r *SessionRepo) CreateSession(ctx context.Context, userID string, expiresAt time.Time) (string, error) {
	var sessionID string
	err := r.pool.QueryRow(ctx,
		`INSERT INTO sessions (user_id, expires_at, last_seen_at)
		 VALUES ($1, $2, now())
		 RETURNING id`,
		userID, expiresAt,
	).Scan(&sessionID)
	if err != nil {
		return "", fmt.Errorf("create session: %w", err)
	}
	return sessionID, nil
}

// UpdateSessionLastSeen bumps the last_seen_at timestamp for a session.
func (r *SessionRepo) UpdateSessionLastSeen(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE sessions SET last_seen_at = now() WHERE id = $1",
		sessionID,
	)
	if err != nil {
		return fmt.Errorf("update session last seen: %w", err)
	}
	return nil
}

// RevokeSession revokes a session by setting expires_at to now.
func (r *SessionRepo) RevokeSession(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE sessions SET expires_at = now() WHERE id = $1",
		sessionID,
	)
	if err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

// StoreRefreshToken inserts a new refresh token hash linked to a session.
func (r *SessionRepo) StoreRefreshToken(ctx context.Context, sessionID, tokenHash string, expiresAt time.Time) (string, error) {
	var tokenID string
	err := r.pool.QueryRow(ctx,
		`INSERT INTO refresh_tokens (session_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		sessionID, tokenHash, expiresAt,
	).Scan(&tokenID)
	if err != nil {
		return "", fmt.Errorf("store refresh token: %w", err)
	}
	return tokenID, nil
}

// RotateRefreshToken marks the old token as rotated, inserts a new token, and returns the new session ID.
func (r *SessionRepo) RotateRefreshToken(ctx context.Context, oldTokenHash, newTokenHash string, newExpiresAt time.Time) (string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Find the old token and its session
	var oldTokenID string
	var sessionID string
	err = tx.QueryRow(ctx,
		`SELECT id, session_id FROM refresh_tokens
		 WHERE token_hash = $1 AND revoked_at IS NULL AND rotated_at IS NULL AND expires_at > now()`,
		oldTokenHash,
	).Scan(&oldTokenID, &sessionID)
	if err != nil {
		return "", fmt.Errorf("find old refresh token: %w", err)
	}

	// Mark old token as rotated
	_, err = tx.Exec(ctx,
		"UPDATE refresh_tokens SET rotated_at = now() WHERE id = $1",
		oldTokenID,
	)
	if err != nil {
		return "", fmt.Errorf("rotate old token: %w", err)
	}

	// Insert new token linked to the same session
	_, err = tx.Exec(ctx,
		`INSERT INTO refresh_tokens (session_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)`,
		sessionID, newTokenHash, newExpiresAt,
	)
	if err != nil {
		return "", fmt.Errorf("insert new refresh token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("commit tx: %w", err)
	}

	return sessionID, nil
}

// RevokeRefreshToken marks a refresh token as revoked.
func (r *SessionRepo) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	tag, err := r.pool.Exec(ctx,
		"UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
		tokenHash,
	)
	if err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return nil
	}
	return nil
}

// GetSessionByRefreshToken retrieves the session for a valid (non-revoked, non-rotated, non-expired) refresh token.
func (r *SessionRepo) GetSessionByRefreshToken(ctx context.Context, tokenHash string) (*models.AuthSession, error) {
	query := `SELECT s.id, s.user_id,
	          COALESCE(to_char(s.expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
	          COALESCE(to_char(s.last_seen_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
	          COALESCE(to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '')
	          FROM refresh_tokens rt
	          JOIN sessions s ON rt.session_id = s.id
	          WHERE rt.token_hash = $1
	            AND rt.revoked_at IS NULL
	            AND rt.rotated_at IS NULL
	            AND rt.expires_at > now()
	            AND s.expires_at > now()`

	var s models.AuthSession
	err := r.pool.QueryRow(ctx, query, tokenHash).Scan(
		&s.ID, &s.UserID, &s.ExpiresAt, &s.LastSeenAt, &s.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get session by refresh token: %w", err)
	}
	return &s, nil
}

// IsReplayedToken checks if a token hash exists but has been rotated or revoked (replay signal).
// Returns (isReplayed, sessionID).
func (r *SessionRepo) IsReplayedToken(ctx context.Context, tokenHash string) (bool, string) {
	var sessionID string
	err := r.pool.QueryRow(ctx,
		`SELECT rt.session_id FROM refresh_tokens rt
		 WHERE rt.token_hash = $1
		   AND (rt.rotated_at IS NOT NULL OR rt.revoked_at IS NOT NULL)`,
		tokenHash,
	).Scan(&sessionID)
	if err != nil {
		return false, ""
	}
	return true, sessionID
}

// RevokeAllSessionTokens revokes all refresh tokens belonging to a session.
func (r *SessionRepo) RevokeAllSessionTokens(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE refresh_tokens SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL",
		sessionID,
	)
	if err != nil {
		return fmt.Errorf("revoke all session tokens: %w", err)
	}
	return nil
}

// IsSessionActive checks whether a session exists and has not expired.
func (r *SessionRepo) IsSessionActive(ctx context.Context, sessionID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM sessions WHERE id = $1 AND expires_at > now())",
		sessionID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check session active: %w", err)
	}
	return exists, nil
}
