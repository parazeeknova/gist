package database

import (
	"fmt"
	"os"
)

// Config holds PostgreSQL connection configuration.
type Config struct {
	DatabaseURL string
}

// ConfigFromEnv reads DATABASE_URL from the environment.
// Returns an error if DATABASE_URL is not set.
func ConfigFromEnv() (Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL environment variable is required")
	}
	return Config{DatabaseURL: databaseURL}, nil
}
