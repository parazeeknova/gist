package database

import (
	"testing"
)

func TestConfigFromEnv_DatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://user:pass@host:5432/db?sslmode=disable")

	cfg, err := ConfigFromEnv()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.DatabaseURL != "postgres://user:pass@host:5432/db?sslmode=disable" {
		t.Errorf("expected DATABASE_URL to be preserved, got %s", cfg.DatabaseURL)
	}
}

func TestConfigFromEnv_Missing(t *testing.T) {
	t.Setenv("DATABASE_URL", "")

	_, err := ConfigFromEnv()
	if err == nil {
		t.Fatal("expected error when DATABASE_URL is not set")
	}
}
