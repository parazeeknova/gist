package database

import (
	"testing"
)

func TestReadMigrations_FindsFiles(t *testing.T) {
	migrations, err := readMigrations()
	if err != nil {
		t.Fatalf("readMigrations: %v", err)
	}

	if len(migrations) == 0 {
		t.Error("expected at least one migration file")
	}

	// Verify migrations are sorted by filename
	for i := 1; i < len(migrations); i++ {
		if migrations[i].name < migrations[i-1].name {
			t.Errorf("migrations not sorted: %s before %s",
				migrations[i-1].name, migrations[i].name)
		}
	}

	// Verify each migration has SQL content
	for _, m := range migrations {
		if m.sql == "" {
			t.Errorf("migration %s has empty SQL content", m.name)
		}
	}

	t.Logf("found %d migration files", len(migrations))
	for _, m := range migrations {
		t.Logf("  %s (%d bytes)", m.name, len(m.sql))
	}
}

func TestReadMigrations_ContainsAuth(t *testing.T) {
	migrations, err := readMigrations()
	if err != nil {
		t.Fatalf("readMigrations: %v", err)
	}

	found := false
	for _, m := range migrations {
		if m.name == "0001_auth.sql" {
			found = true
			break
		}
	}

	if !found {
		t.Error("expected 0001_auth.sql migration")
	}
}

func TestReadMigrations_ContainsPages(t *testing.T) {
	migrations, err := readMigrations()
	if err != nil {
		t.Fatalf("readMigrations: %v", err)
	}

	found := false
	for _, m := range migrations {
		if m.name == "0002_pages.sql" {
			found = true
			break
		}
	}

	if !found {
		t.Error("expected 0002_pages.sql migration")
	}
}
