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

// GetBlogPost returns a blog post by slug
func (h *Handlers) GetBlogPost(c *gin.Context) {
	slug := c.Param("slug")

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

// GetBlogManifest returns the blog manifest
func (h *Handlers) GetBlogManifest(c *gin.Context) {
	c.JSON(http.StatusOK, store.GetBlogManifest())
}

// GetGitHubStats returns GitHub statistics with caching
func (h *Handlers) GetGitHubStats(c *gin.Context) {
	if h.config.GitHubToken == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "GITHUB_TOKEN not configured"})
		return
	}

	username := h.config.GitHubUsername

	// Check cache first
	if cached, ok := h.statsCache.Get(username); ok {
		c.JSON(http.StatusOK, cached)
		return
	}

	// Use singleflight to prevent thundering herd
	result, err, _ := h.statsGroup.Do(username, func() (interface{}, error) {
		stats, computeErr := h.githubService.ComputeStats(c.Request.Context(), h.config.GitHubToken, username)
		if computeErr != nil {
			return nil, computeErr
		}
		// Cache the result
		h.statsCache.Set(username, stats)
		return stats, nil
	})

	if err != nil {
		// Log error server-side with details, return safe error to client
		log.Printf("GitHub stats error for user %s: %v", username, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch GitHub stats"})
		return
	}

	stats := result.(models.GitHubStats)
	c.JSON(http.StatusOK, stats)
}
