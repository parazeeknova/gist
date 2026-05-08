package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
	"verso/backy/database/models"
)

// PushSubscriptionRepo handles database operations for push subscriptions.
type PushSubscriptionRepo struct {
	pool *pgxpool.Pool
}

// NewPushSubscriptionRepo creates a new push subscription repository.
func NewPushSubscriptionRepo() *PushSubscriptionRepo {
	return &PushSubscriptionRepo{pool: database.GetPool()}
}

// Upsert creates or updates a push subscription for a user+endpoint pair.
func (r *PushSubscriptionRepo) Upsert(ctx context.Context, sub models.PushSubscription) error {
	query := `
		INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent, updated_at = EXCLUDED.updated_at`
	now := time.Now().UTC()
	_, err := r.pool.Exec(
		ctx, query,
		sub.ID, sub.UserID, sub.Endpoint, sub.P256DH, sub.Auth, sub.UserAgent,
		now, now,
	)
	if err != nil {
		return fmt.Errorf("upserting push subscription: %w", err)
	}
	return nil
}

// DeleteByUserAndEndpoint removes a push subscription.
func (r *PushSubscriptionRepo) DeleteByUserAndEndpoint(ctx context.Context, userID, endpoint string) error {
	_, err := r.pool.Exec(
		ctx,
		`DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
		userID, endpoint,
	)
	if err != nil {
		return fmt.Errorf("deleting push subscription: %w", err)
	}
	return nil
}

// DeleteByEndpoint removes a push subscription by endpoint (for failed push cleanup).
func (r *PushSubscriptionRepo) DeleteByEndpoint(ctx context.Context, endpoint string) error {
	_, err := r.pool.Exec(
		ctx,
		`DELETE FROM push_subscriptions WHERE endpoint = $1`,
		endpoint,
	)
	if err != nil {
		return fmt.Errorf("deleting push subscription by endpoint: %w", err)
	}
	return nil
}

// ListByUser returns all push subscriptions for a user.
func (r *PushSubscriptionRepo) ListByUser(ctx context.Context, userID string) ([]models.PushSubscription, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at
		 FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing push subscriptions: %w", err)
	}
	defer rows.Close()

	var subs []models.PushSubscription
	for rows.Next() {
		var s models.PushSubscription
		if err := rows.Scan(&s.ID, &s.UserID, &s.Endpoint, &s.P256DH, &s.Auth, &s.UserAgent, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning push subscription: %w", err)
		}
		subs = append(subs, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating push subscriptions: %w", err)
	}
	if subs == nil {
		subs = []models.PushSubscription{}
	}
	return subs, nil
}
