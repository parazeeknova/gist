package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/verso/backy/database"
	"github.com/verso/backy/models"
	"github.com/verso/backy/repositories"
)

// PageService provides business logic over page and page history repositories
type PageService struct {
	pageRepo        *repositories.PageRepo
	pageHistoryRepo *repositories.PageHistoryRepo
}

// NewPageService creates a new page service
func NewPageService(pageRepo *repositories.PageRepo, pageHistoryRepo *repositories.PageHistoryRepo) *PageService {
	return &PageService{
		pageRepo:        pageRepo,
		pageHistoryRepo: pageHistoryRepo,
	}
}

// GetBlogPost retrieves a published page by slug and converts it to a BlogPost response
func (s *PageService) GetBlogPost(ctx context.Context, slug string) (models.BlogPost, error) {
	page, err := s.pageRepo.GetBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, repositories.ErrPageNotFound) {
			return models.BlogPost{}, ErrBlogPostNotFound
		}
		return models.BlogPost{}, fmt.Errorf("getting blog post %q: %w", slug, err)
	}

	return s.pageToBlogPost(page), nil
}

// GetBlogManifest returns all published pages as a blog manifest
func (s *PageService) GetBlogManifest(ctx context.Context) ([]models.BlogManifestSection, error) {
	pages, err := s.pageRepo.ListPublished(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing pages for manifest: %w", err)
	}

	sections := make(map[string][]models.BlogManifestEntry)
	for _, page := range pages {
		section := extractSection(page.SlugID)
		entry := models.BlogManifestEntry{
			Slug:    page.SlugID,
			Title:   page.Title,
			Section: section,
		}
		sections[section] = append(sections[section], entry)
	}

	result := make([]models.BlogManifestSection, 0, len(sections))
	for label, children := range sections {
		result = append(result, models.BlogManifestSection{
			Label:    label,
			Children: children,
		})
	}

	return result, nil
}

// CreatePage inserts a page and creates an initial history entry inside a single transaction.
func (s *PageService) CreatePage(ctx context.Context, page models.Page) error {
	pool := database.GetPool()
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Create tx-scoped repos using a helper or inline the queries.
	// For simplicity we delegate to repository methods that accept a tx-like executor.
	// Since our current repos accept *pgxpool.Pool, we inline the insert here.

	contentJSONBytes := []byte(page.ContentJSON)
	if len(contentJSONBytes) == 0 {
		contentJSONBytes = []byte("{}")
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO pages (id, slug_id, title, icon, cover_photo, content_json, ydoc,
		                   text_content, is_published, parent_page_id, creator_id,
		                   last_updated_by_id, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		page.ID, page.SlugID, page.Title, page.Icon, page.CoverPhoto,
		contentJSONBytes, page.YDoc, page.TextContent, page.IsPublished,
		page.ParentPageID, page.CreatorID, page.LastUpdatedByID,
		page.CreatedAt, page.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting page %q: %w", page.SlugID, err)
	}

	historyID := newUUID()
	historyContentJSONBytes := []byte(page.ContentJSON)
	if len(historyContentJSONBytes) == 0 {
		historyContentJSONBytes = []byte("{}")
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO page_history (id, page_id, title, content_json, ydoc,
		                          text_content, operation, created_by_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		historyID, page.ID, page.Title, historyContentJSONBytes, page.YDoc,
		page.TextContent, "create", page.CreatorID, page.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting page history for page %q: %w", page.ID, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	return nil
}

// ErrBlogPostNotFound is returned when a blog post is not found
var ErrBlogPostNotFound = errors.New("blog post not found")

// ErrPageNotFound is returned when a page is not found.
var ErrPageNotFound = errors.New("page not found")

// ListAllPages returns all pages (published and drafts) from the database.
func (s *PageService) ListAllPages(ctx context.Context) ([]models.Page, error) {
	pages, err := s.pageRepo.ListAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing all pages: %w", err)
	}
	return pages, nil
}

// GetPageByID returns a page by its primary key ID.
func (s *PageService) GetPageByID(ctx context.Context, id string) (models.Page, error) {
	page, err := s.pageRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrPageNotFound) {
			return models.Page{}, ErrPageNotFound
		}
		return models.Page{}, fmt.Errorf("getting page by id %q: %w", id, err)
	}
	return page, nil
}

// pageToBlogPost converts a Page model to a BlogPost response shape
func (s *PageService) pageToBlogPost(page models.Page) models.BlogPost {
	description := page.TextContent
	if len(description) > 200 {
		description = description[:200] + "..."
	}

	// Reconstruct markdown from ProseMirror JSON for backward compat
	markdown := proseMirrorToMarkdown(page.ContentJSON)

	post := models.BlogPost{
		Description:     description,
		Format:          "prosemirror",
		Markdown:        markdown,
		PublishedAt:     page.CreatedAt.Format(time.RFC3339),
		ReadTimeMinutes: estimateReadTime(page.TextContent),
		Section:         extractSection(page.SlugID),
		Slug:            page.SlugID,
		Tags:            []string{extractSection(page.SlugID)},
		Title:           page.Title,
		ContentJSON:     page.ContentJSON,
		Icon:            page.Icon,
		CoverPhoto:      page.CoverPhoto,
	}

	return post
}

// ToMap converts a Page's ContentJSON to a map for external consumption
func ToMap(raw json.RawMessage) map[string]any {
	if raw == nil {
		return nil
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil
	}
	return m
}

// extractSection extracts a section label from a slug
func extractSection(slug string) string {
	idx := strings.Index(slug, "/")
	if idx >= 0 {
		return slug[:idx]
	}
	return slug
}

// estimateReadTime estimates read time in minutes based on text length
func estimateReadTime(text string) int {
	words := 0
	inWord := false
	for _, c := range text {
		if c == ' ' || c == '\n' || c == '\t' || c == '\r' {
			inWord = false
		} else if !inWord {
			inWord = true
			words++
		}
	}
	minutes := words / 200
	if minutes < 1 {
		minutes = 1
	}
	return minutes
}

// newUUID generates a RFC 4122 v4 UUID string.
func newUUID() string {
	return uuid.New().String()
}

// proseMirrorToMarkdown converts a ProseMirror/Tiptap JSON document back to markdown.
// This provides backward compatibility for the existing markdown-based blog reader.
func proseMirrorToMarkdown(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}

	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		return ""
	}

	content, ok := doc["content"].([]any)
	if !ok {
		return ""
	}

	var b strings.Builder
	for _, node := range content {
		nodeMap, ok := node.(map[string]any)
		if !ok {
			continue
		}
		writeMarkdownNode(&b, nodeMap)
	}
	return strings.TrimSpace(b.String())
}

func writeMarkdownNode(b *strings.Builder, node map[string]any) {
	nodeType, _ := node["type"].(string)
	switch nodeType {
	case "heading":
		level := 1
		if attrs, ok := node["attrs"].(map[string]any); ok {
			if l, ok := attrs["level"].(float64); ok {
				level = int(l)
			}
		}
		text := extractNodeText(node)
		if text != "" {
			prefix := strings.Repeat("#", level)
			b.WriteString(prefix)
			b.WriteString(" ")
			b.WriteString(text)
			b.WriteString("\n\n")
		}

	case "paragraph":
		text := extractNodeText(node)
		if text != "" {
			b.WriteString(text)
			b.WriteString("\n\n")
		}

	case "blockquote":
		text := extractNodeText(node)
		if text != "" {
			for _, line := range strings.Split(text, "\n") {
				b.WriteString("> ")
				b.WriteString(line)
				b.WriteString("\n")
			}
			b.WriteString("\n")
		}

	case "codeBlock":
		text := extractNodeText(node)
		b.WriteString("```\n")
		b.WriteString(text)
		b.WriteString("\n```\n\n")

	case "bulletList", "orderedList":
		items, _ := node["content"].([]any)
		for _, item := range items {
			itemMap, _ := item.(map[string]any)
			text := extractNodeText(itemMap)
			if text != "" {
				b.WriteString("- ")
				b.WriteString(text)
				b.WriteString("\n")
			}
		}
		b.WriteString("\n")

	case "listItem":
		text := extractNodeText(node)
		b.WriteString("- ")
		b.WriteString(text)
		b.WriteString("\n")

	default:
		text := extractNodeText(node)
		if text != "" {
			b.WriteString(text)
			b.WriteString("\n\n")
		}
	}
}

// extractNodeText extracts plain text from a ProseMirror node recursively
func extractNodeText(node map[string]any) string {
	// Check for a "text" field in children of type "text"
	content, ok := node["content"].([]any)
	if !ok {
		return ""
	}

	var b strings.Builder
	for _, child := range content {
		childMap, ok := child.(map[string]any)
		if !ok {
			continue
		}
		if childType, _ := childMap["type"].(string); childType == "text" {
			if text, ok := childMap["text"].(string); ok {
				b.WriteString(text)
			}
		} else {
			// Recurse into nested structures (e.g., listItems -> paragraphs -> text)
			b.WriteString(extractNodeText(childMap))
		}
	}
	return b.String()
}
