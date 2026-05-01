package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/verso/backy/auth"
	"github.com/verso/backy/database"
	"github.com/verso/backy/handlers"
	"github.com/verso/backy/middleware"
	"github.com/verso/backy/repositories"
	"github.com/verso/backy/services"
)

func main() {
	_ = godotenv.Load()

	// Validate JWT secret before starting
	if err := auth.ValidateSecret(); err != nil {
		log.Fatalf("JWT secret validation failed: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "7000"
	}

	// Get allowed origins from env
	webOrigin := os.Getenv("WEB_ORIGIN")
	var allowOrigins []string
	if webOrigin != "" {
		allowOrigins = strings.Split(webOrigin, ",")
		filtered := make([]string, 0, len(allowOrigins))
		for _, origin := range allowOrigins {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				filtered = append(filtered, origin)
			}
		}
		allowOrigins = filtered
	} else {
		allowOrigins = []string{
			"http://localhost:3000",
			"http://localhost:7000",
		}
	}

	for _, origin := range allowOrigins {
		if origin == "*" {
			log.Fatal("CORS wildcard '*' cannot be used with AllowCredentials=true. Please specify explicit origins or set AllowCredentials to false.")
		}
	}

	// Initialize database pool
	dbCfg, err := database.ConfigFromEnv()
	if err != nil {
		log.Fatalf("database config: %v", err)
	}
	dbErr := database.InitPool(context.Background(), dbCfg)
	dbAvailable := dbErr == nil
	if !dbAvailable {
		log.Printf("database init warning (blog endpoints will fall back to file-based store): %v", dbErr)
	} else {
		pool := database.GetPool()
		if err := database.MigrateUp(context.Background(), pool); err != nil {
			log.Printf("migration warning: %v", err)
		}
	}

	// Create handlers with configuration
	cfg := handlers.Config{
		GitHubToken:    os.Getenv("GITHUB_TOKEN"),
		GitHubUsername: getEnvOrDefault("GITHUB_USERNAME", "parazeeknova"),
	}

	var h *handlers.Handlers
	if dbAvailable {
		pool := database.GetPool()
		pageRepo := repositories.NewPageRepo(pool)
		pageHistoryRepo := repositories.NewPageHistoryRepo(pool)
		pageService := services.NewPageService(pageRepo, pageHistoryRepo)
		h = handlers.NewWithDB(cfg, pageService)
	} else {
		h = handlers.New(cfg)
	}

	// Create auth service and handlers
	authService := services.NewAuthService()
	authHandlers := handlers.NewAuthHandlers(authService)

	r := gin.Default()

	trustedProxies := os.Getenv("TRUSTED_PROXIES")
	var proxyList []string
	if trustedProxies == "*" {
		proxyList = []string{"*"}
	} else if trustedProxies != "" {
		proxyList = strings.Split(trustedProxies, ",")
	}
	if err := r.SetTrustedProxies(proxyList); err != nil {
		log.Fatalf("failed to set trusted proxies: %v", err)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.GET("/health", h.Health)

	// API routes
	api := r.Group("/api")
	{
		api.GET("/profile", h.GetProfile)
		api.GET("/experience", h.GetExperience)
		api.GET("/projects", h.GetProjects)
		api.GET("/github/stats", h.GetGitHubStats)
		api.GET("/stats", h.GetStats)
		api.GET("/blogs", h.GetBlogManifest)
		api.GET("/blogs/:slug", h.GetBlogPost)

		// Auth routes (public)
		authHandlers.RegisterRoutes(api)
		// Login is rate-limited separately
		api.POST("/auth/login", middleware.RateLimitLogin(), authHandlers.Login)

		// Console routes (protected)
		console := api.Group("/console")
		console.Use(middleware.AuthRequired(authService))
		{
			console.GET("/pages", h.GetConsolePages)
			console.GET("/pages/:id", h.GetConsolePage)
		}
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
