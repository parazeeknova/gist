package handlers

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/verso/backy/cache"
	"github.com/verso/backy/models"
	"github.com/verso/backy/services"
	"github.com/verso/backy/store"
	"golang.org/x/sync/singleflight"
)

// Handlers holds all HTTP handlers
type Handlers struct {
	githubService *services.GitHubService
	statsCache    *cache.StatsCache
	config        Config
	statsGroup    singleflight.Group

	// Optional DB-backed page service; if nil, falls back to file-based store
	pageService *services.PageService
}

// Config holds application configuration
type Config struct {
	GitHubToken    string
	GitHubUsername string
}

// New creates a new handlers instance
func New(cfg Config) *Handlers {
	return &Handlers{
		githubService: services.NewGitHubService(10 * time.Minute),
		statsCache:    cache.NewStatsCache(10 * time.Minute),
		config:        cfg,
	}
}

// NewWithDB creates a new handlers instance with database-backed page service
func NewWithDB(cfg Config, pageService *services.PageService) *Handlers {
	h := New(cfg)
	h.pageService = pageService
	return h
}

// Health returns health check handler
func (h *Handlers) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetProfile returns profile data
func (h *Handlers) GetProfile(c *gin.Context) {
	c.JSON(http.StatusOK, store.Profile)
}

// GetExperience returns experience data
func (h *Handlers) GetExperience(c *gin.Context) {
	c.JSON(http.StatusOK, store.Experiences)
}

// GetProjects returns projects data
func (h *Handlers) GetProjects(c *gin.Context) {
	c.JSON(http.StatusOK, store.Projects)
}

// GetBlogPost returns a blog post by slug (DB-backed when available, else file-backed)
func (h *Handlers) GetBlogPost(c *gin.Context) {
	slug := c.Param("slug")

	if h.pageService != nil {
		h.getBlogPostFromDB(c, slug)
		return
	}

	h.getBlogPostFromFile(c, slug)
}

func (h *Handlers) getBlogPostFromDB(c *gin.Context, slug string) {
	post, err := h.pageService.GetBlogPost(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, services.ErrBlogPostNotFound) {
			h.getBlogPostFromFile(c, slug)
			return
		}
		log.Printf("blog post load error for slug %s: %v", slug, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load blog post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *Handlers) getBlogPostFromFile(c *gin.Context, slug string) {
	post, err := store.GetBlogPost(slug)
	if err != nil {
		if errors.Is(err, store.ErrBlogPostNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}

		log.Printf("blog post load error for slug %s: %v", slug, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load blog post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// GetBlogManifest returns the blog manifest (DB-backed when available, else file-backed)
func (h *Handlers) GetBlogManifest(c *gin.Context) {
	if h.pageService != nil {
		h.getBlogManifestFromDB(c)
		return
	}

	c.JSON(http.StatusOK, store.GetBlogManifest())
}

func (h *Handlers) getBlogManifestFromDB(c *gin.Context) {
	manifest, err := h.pageService.GetBlogManifest(c.Request.Context())
	if err != nil {
		log.Printf("blog manifest error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load blog manifest"})
		return
	}

	if manifest == nil {
		manifest = []models.BlogManifestSection{}
	}

	c.JSON(http.StatusOK, manifest)
}

// GetGitHubStats returns GitHub statistics with caching
func (h *Handlers) GetGitHubStats(c *gin.Context) {
	if h.config.GitHubToken == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "GITHUB_TOKEN not configured"})
		return
	}

	username := h.config.GitHubUsername

	if cached, ok := h.statsCache.Get(username); ok {
		c.JSON(http.StatusOK, cached)
		return
	}

	result, err, _ := h.statsGroup.Do(username, func() (interface{}, error) {
		stats, computeErr := h.githubService.ComputeStats(c.Request.Context(), h.config.GitHubToken, username)
		if computeErr != nil {
			return nil, computeErr
		}
		h.statsCache.Set(username, stats)
		return stats, nil
	})

	if err != nil {
		log.Printf("GitHub stats error for user %s: %v", username, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch GitHub stats"})
		return
	}

	stats := result.(models.GitHubStats)
	c.JSON(http.StatusOK, stats)
}

// ConsolePageSummary is the lightweight response for the console page list.
type ConsolePageSummary struct {
	ID          string `json:"id"`
	SlugID      string `json:"slugId"`
	Title       string `json:"title"`
	Icon        string `json:"icon"`
	IsPublished bool   `json:"isPublished"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// GetConsolePages returns all pages for the console (requires auth via middleware).
func (h *Handlers) GetConsolePages(c *gin.Context) {
	if h.pageService == nil {
		c.JSON(http.StatusOK, []ConsolePageSummary{})
		return
	}

	pages, err := h.pageService.ListAllPages(c.Request.Context())
	if err != nil {
		log.Printf("console pages error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load pages"})
		return
	}

	summaries := make([]ConsolePageSummary, 0, len(pages))
	for _, p := range pages {
		summaries = append(summaries, ConsolePageSummary{
			ID:          p.ID,
			SlugID:      p.SlugID,
			Title:       p.Title,
			Icon:        p.Icon,
			IsPublished: p.IsPublished,
			CreatedAt:   p.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   p.UpdatedAt.Format(time.RFC3339),
		})
	}

	c.JSON(http.StatusOK, summaries)
}

// GetConsolePage returns a single page by ID for the console (requires auth via middleware).
func (h *Handlers) GetConsolePage(c *gin.Context) {
	if h.pageService == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "page not found"})
		return
	}

	id := c.Param("id")

	page, err := h.pageService.GetPageByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, services.ErrPageNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "page not found"})
			return
		}
		log.Printf("console page error for id %s: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load page"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          page.ID,
		"slugId":      page.SlugID,
		"title":       page.Title,
		"icon":        page.Icon,
		"coverPhoto":  page.CoverPhoto,
		"contentJson": page.ContentJSON,
		"textContent": page.TextContent,
		"isPublished": page.IsPublished,
		"createdAt":   page.CreatedAt.Format(time.RFC3339),
		"updatedAt":   page.UpdatedAt.Format(time.RFC3339),
	})
}
