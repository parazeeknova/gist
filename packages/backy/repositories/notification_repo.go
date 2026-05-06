package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
	"verso/backy/models"
)

// NotificationRepo handles database operations for notifications.
type NotificationRepo struct {
	pool *pgxpool.Pool
}

// NewNotificationRepo creates a new notification repository.
func NewNotificationRepo() *NotificationRepo {
	return &NotificationRepo{pool: database.GetPool()}
}

// Insert creates a new notification row.
func (r *NotificationRepo) Insert(ctx context.Context, n models.Notification) error {
	query := `
		INSERT INTO notifications (id, workspace_id, recipient_user_id, actor_user_id, type, title, body, entity_type, entity_id, metadata, read_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
	_, err := r.pool.Exec(
		ctx, query,
		n.ID, n.WorkspaceID, n.RecipientUserID, n.ActorUserID, n.Type,
		n.Title, n.Body, n.EntityType, n.EntityID, n.Metadata,
		n.ReadAt, n.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting notification: %w", err)
	}
	return nil
}

// ListByRecipient returns recent notifications for a user, newest first.
func (r *NotificationRepo) ListByRecipient(ctx context.Context, userID string, limit int) ([]models.NotificationWithActor, error) {
	query := `
		SELECT n.id, COALESCE(n.workspace_id::text, ''), n.recipient_user_id, n.actor_user_id, n.type,
		       n.title, n.body, n.entity_type, n.entity_id, COALESCE(n.metadata::text, '{}'),
		       n.read_at, n.created_at,
		       COALESCE(u.name, ''), COALESCE(u.avatar_url, '')
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_user_id
		WHERE n.recipient_user_id = $1 AND n.deleted_at IS NULL
		ORDER BY n.created_at DESC
		LIMIT $2`
	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("listing notifications: %w", err)
	}
	defer rows.Close()

	var results []models.NotificationWithActor
	for rows.Next() {
		var n models.NotificationWithActor
		var wsID string
		if err := rows.Scan(&n.ID, &wsID, &n.RecipientUserID, &n.ActorUserID, &n.Type,
			&n.Title, &n.Body, &n.EntityType, &n.EntityID, &n.Metadata,
			&n.ReadAt, &n.CreatedAt, &n.ActorName, &n.ActorAvatarURL); err != nil {
			return nil, fmt.Errorf("scanning notification: %w", err)
		}
		if wsID != "" {
			n.WorkspaceID = &wsID
		}
		results = append(results, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating notifications: %w", err)
	}
	if results == nil {
		results = []models.NotificationWithActor{}
	}
	return results, nil
}

// ListUnreadByRecipient returns unread, non-deleted notifications for a user.
func (r *NotificationRepo) ListUnreadByRecipient(ctx context.Context, userID string, limit int) ([]models.NotificationWithActor, error) {
	query := `
		SELECT n.id, COALESCE(n.workspace_id::text, ''), n.recipient_user_id, n.actor_user_id, n.type,
		       n.title, n.body, n.entity_type, n.entity_id, COALESCE(n.metadata::text, '{}'),
		       n.read_at, n.created_at,
		       COALESCE(u.name, ''), COALESCE(u.avatar_url, '')
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_user_id
		WHERE n.recipient_user_id = $1 AND n.read_at IS NULL AND n.deleted_at IS NULL
		ORDER BY n.created_at DESC
		LIMIT $2`
	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("listing unread notifications: %w", err)
	}
	defer rows.Close()

	var results []models.NotificationWithActor
	for rows.Next() {
		var n models.NotificationWithActor
		var wsID string
		if err := rows.Scan(&n.ID, &wsID, &n.RecipientUserID, &n.ActorUserID, &n.Type,
			&n.Title, &n.Body, &n.EntityType, &n.EntityID, &n.Metadata,
			&n.ReadAt, &n.CreatedAt, &n.ActorName, &n.ActorAvatarURL); err != nil {
			return nil, fmt.Errorf("scanning unread notification: %w", err)
		}
		if wsID != "" {
			n.WorkspaceID = &wsID
		}
		results = append(results, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating unread notifications: %w", err)
	}
	if results == nil {
		results = []models.NotificationWithActor{}
	}
	return results, nil
}

// CountUnread returns the number of unread, non-deleted notifications for a user.
func (r *NotificationRepo) CountUnread(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.pool.QueryRow(
		ctx,
		`SELECT COUNT(*) FROM notifications WHERE recipient_user_id = $1 AND read_at IS NULL AND deleted_at IS NULL`,
		userID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting unread notifications: %w", err)
	}
	return count, nil
}

// MarkRead sets read_at on a single notification.
func (r *NotificationRepo) MarkRead(ctx context.Context, id, userID string) error {
	tag, err := r.pool.Exec(
		ctx,
		`UPDATE notifications SET read_at = $1 WHERE id = $2 AND recipient_user_id = $3 AND read_at IS NULL`,
		time.Now().UTC(), id, userID,
	)
	if err != nil {
		return fmt.Errorf("marking notification read: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// MarkAllRead marks all notifications as read for a user.
func (r *NotificationRepo) MarkAllRead(ctx context.Context, userID string) (int, error) {
	tag, err := r.pool.Exec(
		ctx,
		`UPDATE notifications SET read_at = $1 WHERE recipient_user_id = $2 AND read_at IS NULL AND deleted_at IS NULL`,
		time.Now().UTC(), userID,
	)
	if err != nil {
		return 0, fmt.Errorf("marking all notifications read: %w", err)
	}
	return int(tag.RowsAffected()), nil
}

// SoftDelete marks a notification as deleted for a specific user.
func (r *NotificationRepo) SoftDelete(ctx context.Context, id, userID string) error {
	tag, err := r.pool.Exec(
		ctx,
		`UPDATE notifications SET deleted_at = $1 WHERE id = $2 AND recipient_user_id = $3 AND deleted_at IS NULL`,
		time.Now().UTC(), id, userID,
	)
	if err != nil {
		return fmt.Errorf("soft-deleting notification: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// SoftDeleteAll soft-deletes all notifications for a user.
func (r *NotificationRepo) SoftDeleteAll(ctx context.Context, userID string) (int, error) {
	tag, err := r.pool.Exec(
		ctx,
		"UPDATE notifications SET deleted_at = $1 WHERE recipient_user_id = $2 AND deleted_at IS NULL",
		time.Now().UTC(), userID,
	)
	if err != nil {
		return 0, fmt.Errorf("soft-deleting all notifications: %w", err)
	}
	return int(tag.RowsAffected()), nil
}
