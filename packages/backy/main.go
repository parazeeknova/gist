package main

import (
	"log"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/verso/backy/handlers"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "7000"
	}

	// Get allowed origins from env
	webOrigin := os.Getenv("WEB_ORIGIN")
	var allowOrigins []string
	if webOrigin != "" {
		// Support comma-separated origins
		allowOrigins = strings.Split(webOrigin, ",")
		// Filter out empty entries and trim whitespace
		filtered := make([]string, 0, len(allowOrigins))
		for _, origin := range allowOrigins {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				filtered = append(filtered, origin)
			}
		}
		allowOrigins = filtered
	} else {
		// Default origins for development
		allowOrigins = []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:7000",
		}
	}

	// Reject wildcard when AllowCredentials is true
	for _, origin := range allowOrigins {
		if origin == "*" {
			log.Fatal("CORS wildcard '*' cannot be used with AllowCredentials=true. Please specify explicit origins or set AllowCredentials to false.")
		}
	}

	// Create handlers with configuration
	cfg := handlers.Config{
		GitHubToken:    os.Getenv("GITHUB_TOKEN"),
		GitHubUsername: getEnvOrDefault("GITHUB_USERNAME", "parazeeknova"),
	}

	h := handlers.New(cfg)

	r := gin.Default()

	// Don't trust all proxies - use environment variable
	// Empty = don't trust any (safest default)
	// * = trust all (not recommended for production)
	// IP1,IP2 = trust specific IPs
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

	// Configure CORS
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
