package services

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"verso/backy/database"
	"verso/backy/models"
	"verso/backy/repositories"
)

func seedTestData(t *testing.T, db *testDB) (userA *models.AuthUser, userB *models.AuthUser, userC *models.AuthUser, workspace *models.Workspace) {
	t.Helper()
	ctx := context.Background()

	idA := uuid.New().String()
	idB := uuid.New().String()
	idC := uuid.New().String()
	idW := uuid.New().String()

	// Create test users directly via pool (skip auth)
	pool := database.GetPool()
	_, err := pool.Exec(
		ctx,
		`INSERT INTO users (id, username, email, name, role) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15)`,
		idA, "user_a", "a@test.com", "User A", "owner",
		idB, "user_b", "b@test.com", "User B", "member",
		idC, "user_c", "c@test.com", "User C", "member",
	)
	require.NoError(t, err)

	userA = &models.AuthUser{ID: idA, Username: "user_a", Name: "User A", Email: "a@test.com", Role: "owner"}
	userB = &models.AuthUser{ID: idB, Username: "user_b", Name: "User B", Email: "b@test.com", Role: "member"}
	userC = &models.AuthUser{ID: idC, Username: "user_c", Name: "User C", Email: "c@test.com", Role: "member"}

	// Create workspace directly
	_, err = pool.Exec(
		ctx,
		`INSERT INTO workspaces (id, name, slug) VALUES ($1, $2, $3)`,
		idW, "Test Workspace", "test-workspace",
	)
	require.NoError(t, err)

	// Add memberships
	_, err = pool.Exec(
		ctx,
		`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $5), ($1, $6, $7)`,
		idW, idA, "owner", idB, "member", idC, "member",
	)
	require.NoError(t, err)

	workspace = &models.Workspace{ID: idW, Name: "Test Workspace", Slug: "test-workspace"}
	return
}

func TestNotificationService_CreateAndList(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, userB, _, ws := seedTestData(t, db)

	notifRepo := repositories.NewNotificationRepo()
	pushSubRepo := repositories.NewPushSubscriptionRepo()
	svc := NewNotificationService(notifRepo, pushSubRepo)

	// Create a notification event
	event := NotificationEvent{
		Type:         EventSpaceCreated,
		WorkspaceID:  ws.ID,
		ActorID:      userA.ID,
		RecipientIDs: []string{userB.ID},
		EntityType:   "space",
		EntityID:     "space-123",
		Metadata:     map[string]string{"name": "My Space"},
	}

	svc.Notify(ctx, event)

	// List notifications for user B
	notifs, err := svc.GetNotifications(ctx, userB.ID, 10)
	require.NoError(t, err)
	assert.Len(t, notifs, 1)
	assert.Equal(t, "Space created", notifs[0].Title)
	assert.Equal(t, string(EventSpaceCreated), notifs[0].Type)
	assert.Nil(t, notifs[0].ReadAt)

	// User A should have no notifications (actor excluded)
	notifsA, err := svc.GetNotifications(ctx, userA.ID, 10)
	require.NoError(t, err)
	assert.Len(t, notifsA, 0)
}

func TestNotificationService_ActorReceivesOwnNotification(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, _, _, ws := seedTestData(t, db)

	notifRepo := repositories.NewNotificationRepo()
	pushSubRepo := repositories.NewPushSubscriptionRepo()
	svc := NewNotificationService(notifRepo, pushSubRepo)

	// Actor is also a recipient — should still receive the notification
	event := NotificationEvent{
		Type:         EventWorkspaceRenamed,
		WorkspaceID:  ws.ID,
		ActorID:      userA.ID,
		RecipientIDs: []string{userA.ID},
		Metadata:     map[string]string{"name": "Renamed"},
	}

	svc.Notify(ctx, event)

	notifs, err := svc.GetNotifications(ctx, userA.ID, 10)
	require.NoError(t, err)
	assert.Len(t, notifs, 1, "actor should receive their own notification")
}

func TestNotificationService_MarkRead(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, userB, _, ws := seedTestData(t, db)

	notifRepo := repositories.NewNotificationRepo()
	pushSubRepo := repositories.NewPushSubscriptionRepo()
	svc := NewNotificationService(notifRepo, pushSubRepo)

	// Create two notifications
	event1 := NotificationEvent{
		Type:         EventSpaceCreated,
		WorkspaceID:  ws.ID,
		ActorID:      userA.ID,
		RecipientIDs: []string{userB.ID},
		Metadata:     map[string]string{"name": "Space 1"},
	}
	event2 := NotificationEvent{
		Type:         EventSpaceCreated,
		WorkspaceID:  ws.ID,
		ActorID:      userA.ID,
		RecipientIDs: []string{userB.ID},
		Metadata:     map[string]string{"name": "Space 2"},
	}

	svc.Notify(ctx, event1)
	svc.Notify(ctx, event2)

	// Both unread
	count, err := svc.CountUnread(ctx, userB.ID)
	require.NoError(t, err)
	assert.Equal(t, 2, count)

	// Mark one read
	notifs, err := svc.GetNotifications(ctx, userB.ID, 10)
	require.NoError(t, err)
	require.Len(t, notifs, 2)
	err = svc.MarkRead(ctx, notifs[0].ID, userB.ID)
	require.NoError(t, err)

	// One unread remaining
	count, err = svc.CountUnread(ctx, userB.ID)
	require.NoError(t, err)
	assert.Equal(t, 1, count)

	// Mark all read
	n, err := svc.MarkAllRead(ctx, userB.ID)
	require.NoError(t, err)
	assert.Equal(t, 1, n)

	// Zero unread
	count, err = svc.CountUnread(ctx, userB.ID)
	require.NoError(t, err)
	assert.Equal(t, 0, count)
}

func TestNotificationService_UnreadCount(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, userB, userC, ws := seedTestData(t, db)

	notifRepo := repositories.NewNotificationRepo()
	pushSubRepo := repositories.NewPushSubscriptionRepo()
	svc := NewNotificationService(notifRepo, pushSubRepo)

	// Send to userB only
	svc.Notify(ctx, NotificationEvent{
		Type:         EventSpaceCreated,
		WorkspaceID:  ws.ID,
		ActorID:      userA.ID,
		RecipientIDs: []string{userB.ID},
		Metadata:     map[string]string{"name": "space"},
	})

	// UserB has 1
	count, err := svc.CountUnread(ctx, userB.ID)
	require.NoError(t, err)
	assert.Equal(t, 1, count)

	// UserC has 0
	count, err = svc.CountUnread(ctx, userC.ID)
	require.NoError(t, err)
	assert.Equal(t, 0, count)

	// UserA (actor) has 0
	count, err = svc.CountUnread(ctx, userA.ID)
	require.NoError(t, err)
	assert.Equal(t, 0, count)
}

func TestPushSubscriptionService_UpsertAndDelete(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, _, _, _ := seedTestData(t, db)

	pushSubRepo := repositories.NewPushSubscriptionRepo()
	notifRepo := repositories.NewNotificationRepo()
	svc := NewNotificationService(notifRepo, pushSubRepo)

	sub := models.PushSubscription{
		ID:        uuid.New().String(),
		UserID:    userA.ID,
		Endpoint:  "https://example.com/push/endpoint",
		P256DH:    "test-p256dh-key",
		Auth:      "test-auth-secret",
		UserAgent: "TestAgent/1.0",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	// Save
	err := svc.UpsertPushSubscription(ctx, sub)
	require.NoError(t, err)

	// List
	subs, err := pushSubRepo.ListByUser(ctx, userA.ID)
	require.NoError(t, err)
	assert.Len(t, subs, 1)
	assert.Equal(t, "https://example.com/push/endpoint", subs[0].Endpoint)

	// Upsert again (same user+endpoint) should update
	sub.P256DH = "updated-p256dh"
	err = svc.UpsertPushSubscription(ctx, sub)
	require.NoError(t, err)

	subs, err = pushSubRepo.ListByUser(ctx, userA.ID)
	require.NoError(t, err)
	assert.Len(t, subs, 1)
	assert.Equal(t, "updated-p256dh", subs[0].P256DH)

	// Delete
	err = svc.DeletePushSubscription(ctx, userA.ID, sub.Endpoint)
	require.NoError(t, err)

	subs, err = pushSubRepo.ListByUser(ctx, userA.ID)
	require.NoError(t, err)
	assert.Len(t, subs, 0)
}

func TestPushSubscriptionService_DeleteByEndpoint_Cleanup(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, _, _, _ := seedTestData(t, db)

	pushSubRepo := repositories.NewPushSubscriptionRepo()

	sub := models.PushSubscription{
		ID:        uuid.New().String(),
		UserID:    userA.ID,
		Endpoint:  "https://gone.example.com/push",
		P256DH:    "test-p256dh",
		Auth:      "test-auth",
		UserAgent: "Test/1.0",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	err := pushSubRepo.Upsert(ctx, sub)
	require.NoError(t, err)

	// Delete by endpoint only (failed push cleanup)
	err = pushSubRepo.DeleteByEndpoint(ctx, "https://gone.example.com/push")
	require.NoError(t, err)

	subs, err := pushSubRepo.ListByUser(ctx, userA.ID)
	require.NoError(t, err)
	assert.Len(t, subs, 0)
}

func TestNotificationService_GenerateText(t *testing.T) {
	svc := &NotificationService{}

	tests := []struct {
		eventType     NotificationEventType
		metadata      map[string]string
		expectedTitle string
		containsBody  string
	}{
		{EventWorkspaceRenamed, map[string]string{"name": "My WS"}, "Workspace renamed", "My WS"},
		{EventSpaceCreated, map[string]string{"name": "Notes"}, "Space created", "Notes"},
		{EventSpaceRenamed, map[string]string{"name": "Docs"}, "Space renamed", "Docs"},
		{EventGroupMemberAdded, map[string]string{"groupName": "Admins"}, "Added to group", "Admins"},
		{EventGroupMemberRemoved, map[string]string{"groupName": "Editors"}, "Removed from group", "Editors"},
		{EventRoleChanged, map[string]string{"role": "admin"}, "Role changed", "admin"},
		{EventPageUpdated, map[string]string{"name": "Home"}, "Page updated", "Home"},
		{EventPageCreated, map[string]string{"name": "Welcome"}, "Page created", "Welcome"},
		{EventWorkspaceMemberAdded, map[string]string{"name": "Acme"}, "Added to workspace", "Acme"},
		{EventSpaceMemberAdded, map[string]string{"name": "General"}, "Added to space", "General"},
		{EventProfileAvatarUpdated, nil, "Avatar updated", ""},
	}

	for _, tt := range tests {
		t.Run(string(tt.eventType), func(t *testing.T) {
			event := NotificationEvent{
				Type:     tt.eventType,
				Metadata: tt.metadata,
			}
			title, body := svc.generateText(event)
			assert.Equal(t, tt.expectedTitle, title)
			if tt.containsBody != "" {
				assert.Contains(t, body, tt.containsBody)
			}
		})
	}
}

func TestNotifier_NoopNotifier(t *testing.T) {
	notifier := NoopNotifier()
	// Should not panic
	notifier.Notify(context.Background(), NotificationEvent{
		Type:         EventSpaceCreated,
		WorkspaceID:  "ws-1",
		ActorID:      "user-1",
		RecipientIDs: []string{"user-2"},
	})
}

func TestNotificationService_RecipientFiltering(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set")
	}

	db := setupTestDB(t)
	ctx := context.Background()

	userA, userB, userC, ws := seedTestData(t, db)

	notifRepo := repositories.NewNotificationRepo()
	pushSubRepo := repositories.NewPushSubscriptionRepo()
	svc := NewNotificationService(notifRepo, pushSubRepo)

	// Actor A sends to B and C
	svc.Notify(ctx, NotificationEvent{
		Type:         EventPageUpdated,
		WorkspaceID:  ws.ID,
		ActorID:      userA.ID,
		RecipientIDs: []string{userB.ID, userC.ID},
		EntityType:   "page",
		EntityID:     "page-1",
		Metadata:     map[string]string{"name": "Updated Page"},
	})

	// B gets the notification
	notifsB, err := svc.GetNotifications(ctx, userB.ID, 10)
	require.NoError(t, err)
	assert.Len(t, notifsB, 1)

	// C gets the notification
	notifsC, err := svc.GetNotifications(ctx, userC.ID, 10)
	require.NoError(t, err)
	assert.Len(t, notifsC, 1)

	// A does NOT get the notification (actor excluded)
	notifsA, err := svc.GetNotifications(ctx, userA.ID, 10)
	require.NoError(t, err)
	assert.Len(t, notifsA, 0)
}
