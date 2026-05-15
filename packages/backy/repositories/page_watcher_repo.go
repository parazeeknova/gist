package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
)

// PageWatcherRepo handles database operations for page watchers.
type PageWatcherRepo struct {
	pool *pgxpool.Pool
}

// NewPageWatcherRepo creates a new page watcher repository.
func NewPageWatcherRepo() *PageWatcherRepo {
	return &PageWatcherRepo{pool: database.GetPool()}
}

// Toggle adds or removes a watcher for a page.
// Returns true if the user is now watching the page.
func (r *PageWatcherRepo) Toggle(ctx context.Context, userID, pageID string) (bool, error) {
	var watching bool
	err := r.pool.QueryRow(ctx, `
		WITH removed AS (
			DELETE FROM page_watchers WHERE user_id = $1 AND page_id = $2 RETURNING 1
		)
		INSERT INTO page_watchers (user_id, page_id)
		SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM removed)
		RETURNING (NOT EXISTS (SELECT 1 FROM removed))::boolean AS inserted
	`, userID, pageID).Scan(&watching)
	if err != nil {
		return false, fmt.Errorf("toggling page watcher: %w", err)
	}
	return watching, nil
}

// IsWatching returns true when the user watches the page.
func (r *PageWatcherRepo) IsWatching(ctx context.Context, userID, pageID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM page_watchers WHERE user_id = $1 AND page_id = $2)`, userID, pageID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking page watcher: %w", err)
	}
	return exists, nil
}

// ListByPage returns all watcher user IDs for a page.
func (r *PageWatcherRepo) ListByPage(ctx context.Context, pageID string) ([]string, error) {
	rows, err := r.pool.Query(ctx, `SELECT user_id FROM page_watchers WHERE page_id = $1 ORDER BY created_at DESC`, pageID)
	if err != nil {
		return nil, fmt.Errorf("listing page watchers: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scanning page watcher: %w", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating page watchers: %w", err)
	}
	if ids == nil {
		ids = []string{}
	}
	return ids, nil
}

// Insert adds a page watcher row, ignoring duplicates.
func (r *PageWatcherRepo) Insert(ctx context.Context, userID, pageID string) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO page_watchers (user_id, page_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, userID, pageID, time.Now().UTC())
	if err != nil {
		return fmt.Errorf("adding page watcher: %w", err)
	}
	return nil
}

// Remove deletes a page watcher row.
func (r *PageWatcherRepo) Remove(ctx context.Context, userID, pageID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM page_watchers WHERE user_id = $1 AND page_id = $2`, userID, pageID)
	if err != nil {
		return fmt.Errorf("removing page watcher: %w", err)
	}
	return nil
}

// Snapshot represents a deleted page and its metadata for notification fan-out.
type WatchPageSnapshot struct {
	PageID      string
	SpaceID     string
	WorkspaceID string
	Title       string
}
