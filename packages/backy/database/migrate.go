package database

import (
	"context"
	"embed"
	"fmt"
	"log"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var embeddedMigrations embed.FS

// MigrateUp runs all SQL migration files from the embedded migrations directory against the pool.
// Migrations are run in filename order and are idempotent (use CREATE TABLE IF NOT EXISTS).
func MigrateUp(ctx context.Context, pool *pgxpool.Pool) error {
	migrations, err := readMigrations()
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	for _, m := range migrations {
		log.Printf("migrate: applying %s", m.name)
		if _, err := pool.Exec(ctx, m.sql); err != nil {
			return fmt.Errorf("apply migration %s: %w", m.name, err)
		}
	}

	log.Printf("migrate: %d migrations applied", len(migrations))
	return nil
}

// MigrateReset drops all tables from the public schema and re-runs migrations.
func MigrateReset(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("migrate: dropping all tables in public schema...")
	dropSQL := `
	DO $$ DECLARE
		r RECORD;
	BEGIN
		FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
			EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
		END LOOP;
	END $$;
	`
	if _, err := pool.Exec(ctx, dropSQL); err != nil {
		return fmt.Errorf("drop tables: %w", err)
	}

	return MigrateUp(ctx, pool)
}

type migration struct {
	name string
	sql  string
}

func readMigrations() ([]migration, error) {
	entries, err := embeddedMigrations.ReadDir("migrations")
	if err != nil {
		return nil, fmt.Errorf("read embedded migrations dir: %w", err)
	}

	var migrations []migration
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		content, err := embeddedMigrations.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return nil, fmt.Errorf("read embedded migration %s: %w", entry.Name(), err)
		}

		migrations = append(migrations, migration{
			name: entry.Name(),
			sql:  string(content),
		})
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].name < migrations[j].name
	})

	return migrations, nil
}
