package testutil

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"

	"verso/backy/database"
	"verso/backy/repositories"
)

type TestDB struct {
	Pool            *pgxpool.Pool
	SQLDB           *sql.DB
	UserRepo        *repositories.UserRepo
	WorkspaceRepo   *repositories.WorkspaceRepo
	SpaceRepo       *repositories.SpaceRepo
	GroupRepo       *repositories.GroupRepo
	PageRepo        *repositories.PageRepo
	PageHistoryRepo *repositories.PageHistoryRepo
}

func SetupTestDB(t *testing.T) *TestDB {
	t.Helper()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping DB integration test")
	}

	testURL := GetTestDatabaseURL(t, databaseURL)

	cfg := database.Config{DatabaseURL: testURL}
	ctx := context.Background()
	pool, err := database.NewPool(ctx, cfg)
	if err != nil {
		t.Fatalf("connect to test db: %v", err)
	}

	if err := database.MigrateUp(ctx, pool); err != nil {
		pool.Close()
		t.Fatalf("run migrations: %v", err)
	}

	sqlDB, err := sql.Open("pgx", testURL)
	if err != nil {
		pool.Close()
		t.Fatalf("open sql db: %v", err)
	}

	userRepo := repositories.NewUserRepo()
	workspaceRepo := repositories.NewWorkspaceRepo()
	spaceRepo := repositories.NewSpaceRepo()
	groupRepo := repositories.NewGroupRepo()
	pageRepo := repositories.NewPageRepo(pool)
	pageHistoryRepo := repositories.NewPageHistoryRepo(pool)

	return &TestDB{
		Pool:            pool,
		SQLDB:           sqlDB,
		UserRepo:        userRepo,
		WorkspaceRepo:   workspaceRepo,
		SpaceRepo:       spaceRepo,
		GroupRepo:       groupRepo,
		PageRepo:        pageRepo,
		PageHistoryRepo: pageHistoryRepo,
	}
}

func GetTestDatabaseURL(t *testing.T, databaseURL string) string {
	t.Helper()

	u, err := url.Parse(databaseURL)
	if err != nil {
		t.Fatalf("parse database url: %v", err)
	}

	originalDB := strings.TrimPrefix(u.Path, "/")
	if originalDB == "" {
		originalDB = "verso"
	}
	testDBName := originalDB + "_test"

	u.Path = "/postgres"
	adminCfg := database.Config{DatabaseURL: u.String()}

	ctx := context.Background()
	adminPool, err := database.NewPool(ctx, adminCfg)
	if err != nil {
		t.Fatalf("connect to postgres db: %v", err)
	}
	defer adminPool.Close()

	_, err = adminPool.Exec(ctx, fmt.Sprintf(`CREATE DATABASE "%s"`, testDBName))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42P04" {
			// already exists, skip
		} else {
			t.Fatalf("create test database: %v", err)
		}
	}

	u.Path = "/" + testDBName
	return u.String()
}
