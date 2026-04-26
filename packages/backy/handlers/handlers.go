package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gist/backy/cache"
	"github.com/gist/backy/models"
	"github.com/gist/backy/services"
	"github.com/gist/backy/store"
)

// Handlers holds all HTTP handlers
type Handlers struct {
	githubService *services.GitHubService
	statsCache    *cache.StatsCache
	config        Config
}

// Config holds application configuration
type Config struct {
	GitHubToken    string
	GitHubUsername string
}

// New creates a new handlers instance
func New(cfg Config) *Handlers {
	return &Handlers{
		githubService: services.NewGitHubService(10 * time.Second),
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

// GetGitHubStats returns GitHub statistics with caching
func (h *Handlers) GetGitHubStats(c *gin.Context) {
	if h.config.GitHubToken == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "GITHUB_TOKEN not configured"})
		return
	}

	// Check cache first
	if cached, ok := h.statsCache.Get(h.config.GitHubUsername); ok {
		c.JSON(http.StatusOK, cached)
		return
	}

	stats, err := h.githubService.ComputeStats(c.Request.Context(), h.config.GitHubToken, h.config.GitHubUsername)
	if err != nil {
		// Log error server-side with details, return safe defaults to client
		fmt.Printf("GitHub stats error for user %s: %v\n", h.config.GitHubUsername, err)
		c.JSON(http.StatusOK, models.GitHubStats{
			CommitsThisMonth: 0,
			CommitsLastYear:  0,
			PRsThisMonth:     0,
			Orgs:             []models.GitHubOrg{},
		})
		return
	}
	fmt.Printf("GitHub stats fetched: %+v\n", stats)

	// Cache the result
	h.statsCache.Set(h.config.GitHubUsername, stats)
	c.JSON(http.StatusOK, stats)
}
