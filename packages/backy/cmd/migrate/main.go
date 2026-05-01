package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/verso/backy/database"
)

func main() {
	_ = godotenv.Load()

	if len(os.Args) < 2 {
		log.Fatal("usage: go run ./cmd/migrate <up|reset>")
	}

	command := os.Args[1]

	cfg, err := database.ConfigFromEnv()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	pool, err := database.NewPool(ctx, cfg)
	if err != nil {
		log.Fatalf("pool: %v", err)
	}
	defer pool.Close()

	switch command {
	case "up":
		if err := database.MigrateUp(ctx, pool); err != nil {
			log.Fatalf("migrate up: %v", err)
		}
	case "reset":
		if err := database.MigrateReset(ctx, pool); err != nil {
			log.Fatalf("migrate reset: %v", err)
		}
	default:
		log.Fatalf("unknown command: %s (use 'up' or 'reset')", command)
	}

	log.Println("migration complete")
}
