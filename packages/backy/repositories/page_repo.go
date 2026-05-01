package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/verso/backy/models"
)

var ErrPageNotFound = errors.New("page not found")

// PageRepo handles database operations for pages
type PageRepo struct {
	pool *pgxpool.Pool
}

// NewPageRepo creates a new page repository
func NewPageRepo(pool *pgxpool.Pool) *PageRepo {
	return &PageRepo{pool: pool}
}

// GetBySlug fetches a published page by its slug_id
func (r *PageRepo) GetBySlug(ctx context.Context, slug string) (models.Page, error) {
	query := `
		SELECT id, slug_id, title, icon, cover_photo, content_json, ydoc,
		       text_content, is_published, parent_page_id, creator_id,
		       last_updated_by_id, created_at, updated_at
		FROM pages
		WHERE slug_id = $1 AND is_published = true`

	var p models.Page
	var contentJSONBytes []byte

	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&p.ID, &p.SlugID, &p.Title, &p.Icon, &p.CoverPhoto,
		&contentJSONBytes, &p.YDoc, &p.TextContent, &p.IsPublished,
		&p.ParentPageID, &p.CreatorID, &p.LastUpdatedByID,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Page{}, ErrPageNotFound
		}
		return models.Page{}, fmt.Errorf("querying page by slug %q: %w", slug, err)
	}

	p.ContentJSON = json.RawMessage(contentJSONBytes)

	return p, nil
}

// ListPublished returns all published pages, ordered by created_at desc
func (r *PageRepo) ListPublished(ctx context.Context) ([]models.Page, error) {
	query := `
		SELECT id, slug_id, title, icon, cover_photo, content_json, ydoc,
		       text_content, is_published, parent_page_id, creator_id,
		       last_updated_by_id, created_at, updated_at
		FROM pages
		WHERE is_published = true
		ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing published pages: %w", err)
	}
	defer rows.Close()

	var pages []models.Page
	for rows.Next() {
		var p models.Page
		var contentJSONBytes []byte

		if err := rows.Scan(
			&p.ID, &p.SlugID, &p.Title, &p.Icon, &p.CoverPhoto,
			&contentJSONBytes, &p.YDoc, &p.TextContent, &p.IsPublished,
			&p.ParentPageID, &p.CreatorID, &p.LastUpdatedByID,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning page row: %w", err)
		}

		p.ContentJSON = json.RawMessage(contentJSONBytes)

		pages = append(pages, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating page rows: %w", err)
	}

	return pages, nil
}

// ListAll returns all pages (both published and drafts), ordered by created_at desc.
func (r *PageRepo) ListAll(ctx context.Context) ([]models.Page, error) {
	query := `
		SELECT id, slug_id, title, icon, cover_photo, content_json, ydoc,
		       text_content, is_published, parent_page_id, creator_id,
		       last_updated_by_id, created_at, updated_at
		FROM pages
		ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing all pages: %w", err)
	}
	defer rows.Close()

	var pages []models.Page
	for rows.Next() {
		var p models.Page
		var contentJSONBytes []byte

		if err := rows.Scan(
			&p.ID, &p.SlugID, &p.Title, &p.Icon, &p.CoverPhoto,
			&contentJSONBytes, &p.YDoc, &p.TextContent, &p.IsPublished,
			&p.ParentPageID, &p.CreatorID, &p.LastUpdatedByID,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning page row: %w", err)
		}

		p.ContentJSON = json.RawMessage(contentJSONBytes)

		pages = append(pages, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating page rows: %w", err)
	}

	return pages, nil
}

// GetByID fetches a page by its primary key ID (not slug).
func (r *PageRepo) GetByID(ctx context.Context, id string) (models.Page, error) {
	query := `
		SELECT id, slug_id, title, icon, cover_photo, content_json, ydoc,
		       text_content, is_published, parent_page_id, creator_id,
		       last_updated_by_id, created_at, updated_at
		FROM pages
		WHERE id = $1`

	var p models.Page
	var contentJSONBytes []byte

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.SlugID, &p.Title, &p.Icon, &p.CoverPhoto,
		&contentJSONBytes, &p.YDoc, &p.TextContent, &p.IsPublished,
		&p.ParentPageID, &p.CreatorID, &p.LastUpdatedByID,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Page{}, ErrPageNotFound
		}
		return models.Page{}, fmt.Errorf("querying page by id %q: %w", id, err)
	}

	p.ContentJSON = json.RawMessage(contentJSONBytes)

	return p, nil
}

// Insert creates a new page row
func (r *PageRepo) Insert(ctx context.Context, p models.Page) error {
	contentJSONBytes := []byte(p.ContentJSON)
	if len(contentJSONBytes) == 0 {
		contentJSONBytes = []byte("{}")
	}

	query := `
		INSERT INTO pages (id, slug_id, title, icon, cover_photo, content_json, ydoc,
		                   text_content, is_published, parent_page_id, creator_id,
		                   last_updated_by_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	_, err := r.pool.Exec(ctx, query,
		p.ID, p.SlugID, p.Title, p.Icon, p.CoverPhoto,
		contentJSONBytes, p.YDoc, p.TextContent, p.IsPublished,
		p.ParentPageID, p.CreatorID, p.LastUpdatedByID,
		p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting page %q: %w", p.SlugID, err)
	}

	return nil
}

// Update modifies an existing page row
func (r *PageRepo) Update(ctx context.Context, p models.Page) error {
	contentJSONBytes := []byte(p.ContentJSON)
	if len(contentJSONBytes) == 0 {
		contentJSONBytes = []byte("{}")
	}

	query := `
		UPDATE pages
		SET title = $1, icon = $2, cover_photo = $3, content_json = $4, ydoc = $5,
		    text_content = $6, is_published = $7, parent_page_id = $8,
		    last_updated_by_id = $9, updated_at = $10
		WHERE id = $11`

	tag, err := r.pool.Exec(ctx, query,
		p.Title, p.Icon, p.CoverPhoto, contentJSONBytes, p.YDoc,
		p.TextContent, p.IsPublished, p.ParentPageID,
		p.LastUpdatedByID, p.UpdatedAt, p.ID,
	)
	if err != nil {
		return fmt.Errorf("updating page %q: %w", p.SlugID, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%w: page %q", ErrPageNotFound, p.SlugID)
	}

	return nil
}
