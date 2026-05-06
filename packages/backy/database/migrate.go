package database

import (
	"context"
	"embed"
	"fmt"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/logger"
)

//go:embed migrations/*.sql
var embeddedMigrations embed.FS

// MigrateUp runs all pending SQL migration files from the embedded migrations directory.
// Applied migrations are tracked in a schema_migrations table so each migration runs only once.
// Uses a PostgreSQL transaction-level advisory lock to prevent concurrent instances from racing.
func MigrateUp(ctx context.Context, pool *pgxpool.Pool) error {
	// Take a transaction-level advisory lock so only one instance migrates at a time.
	lockTx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin lock tx: %w", err)
	}
	defer func() { _ = lockTx.Rollback(ctx) }()

	if _, err := lockTx.Exec(ctx, "SELECT pg_advisory_xact_lock(8675309)"); err != nil {
		return fmt.Errorf("acquire advisory lock: %w", err)
	}

	if err := ensureMigrationsTable(ctx, pool); err != nil {
		return fmt.Errorf("ensure migrations table: %w", err)
	}

	applied, err := listAppliedMigrations(ctx, pool)
	if err != nil {
		return fmt.Errorf("list applied migrations: %w", err)
	}

	migrations, err := readMigrations()
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	var pending []migration
	for _, m := range migrations {
		if !applied[m.name] {
			pending = append(pending, m)
		}
	}

	if len(pending) == 0 {
		logger.Log.Info().Msg("migrations: no pending migrations")
		return lockTx.Commit(ctx)
	}

	// Release the advisory lock; each migration runs in its own transaction below.
	if err := lockTx.Commit(ctx); err != nil {
		return fmt.Errorf("commit lock tx: %w", err)
	}

	for _, m := range pending {
		logger.Log.Info().Str("name", m.name).Msg("applying migration")

		tx, txErr := pool.Begin(ctx)
		if txErr != nil {
			return fmt.Errorf("begin tx for %s: %w", m.name, txErr)
		}

		if _, err := tx.Exec(ctx, m.sql); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("apply migration %s: %w", m.name, err)
		}

		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (name, applied_at) VALUES ($1, now())`, m.name); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("record migration %s: %w", m.name, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit migration %s: %w", m.name, err)
		}
	}

	logger.Log.Info().Int("count", len(pending)).Msg("migrations applied")
	return nil
}

// MigrateReset drops all tables from the public schema, clears migration tracking, and re-runs all migrations.
func MigrateReset(ctx context.Context, pool *pgxpool.Pool) error {
	logger.Log.Info().Msg("migrate: dropping all tables in public schema...")
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

func ensureMigrationsTable(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`)
	return err
}

func listAppliedMigrations(ctx context.Context, pool *pgxpool.Pool) (map[string]bool, error) {
	rows, err := pool.Query(ctx, `SELECT name FROM schema_migrations`)
	if err != nil {
		if err == pgx.ErrNoRows {
			return map[string]bool{}, nil
		}
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		applied[name] = true
	}
	return applied, rows.Err()
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
