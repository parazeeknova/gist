package testutil

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"verso/backy/database/models"
)

func CreateTestUser(t *testing.T, ctx context.Context, db *TestDB, username, email string) string {
	t.Helper()

	id, err := db.UserRepo.CreateUser(ctx, username, email, username, "", "member")
	require.NoError(t, err)
	return id
}

func CreateTestWorkspace(t *testing.T, ctx context.Context, db *TestDB, name, slug string) models.Workspace {
	t.Helper()

	ws := models.Workspace{
		ID:   uuid.New().String(),
		Name: name,
		Slug: slug,
	}
	err := db.WorkspaceRepo.Insert(ctx, ws)
	require.NoError(t, err)
	return ws
}

func AddWorkspaceMember(t *testing.T, ctx context.Context, db *TestDB, workspaceID, userID, role string) {
	t.Helper()

	err := db.WorkspaceRepo.AddMember(ctx, workspaceID, userID, role)
	require.NoError(t, err)
}
