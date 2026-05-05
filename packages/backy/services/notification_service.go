package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/google/uuid"

	"verso/backy/logger"
	"verso/backy/models"
	"verso/backy/repositories"
)

// NotificationService creates persistent notification rows and delivers browser push.
type NotificationService struct {
	notifRepo   *repositories.NotificationRepo
	pushSubRepo *repositories.PushSubscriptionRepo
}

// NewNotificationService creates a new notification service.
func NewNotificationService(notifRepo *repositories.NotificationRepo, pushSubRepo *repositories.PushSubscriptionRepo) *NotificationService {
	return &NotificationService{
		notifRepo:   notifRepo,
		pushSubRepo: pushSubRepo,
	}
}

// Notify implements the Notifier interface. Creates persistent notification rows
// and triggers browser push delivery asynchronously.
func (s *NotificationService) Notify(ctx context.Context, event NotificationEvent) {
	title, body := s.generateText(event)

	bgCtx := context.Background()
	for _, recipientID := range event.RecipientIDs {

		metadataJSON := "{}"
		if len(event.Metadata) > 0 {
			b, err := json.Marshal(event.Metadata)
			if err == nil {
				metadataJSON = string(b)
			}
		}

		n := models.Notification{
			ID:              uuid.New().String(),
			WorkspaceID:     event.WorkspaceID,
			RecipientUserID: recipientID,
			ActorUserID:     &event.ActorID,
			Type:            string(event.Type),
			Title:           title,
			Body:            body,
			EntityType:      event.EntityType,
			EntityID:        event.EntityID,
			Metadata:        metadataJSON,
			CreatedAt:       time.Now().UTC(),
		}

		if err := s.notifRepo.Insert(ctx, n); err != nil {
			logger.Log.Error().Err(err).
				Str("recipient", recipientID).
				Str("type", string(event.Type)).
				Msg("failed to create notification")
			continue
		}

		go s.deliverPush(bgCtx, recipientID, n)
	}
}

// CountUnread returns the number of unread notifications for a user.
func (s *NotificationService) CountUnread(ctx context.Context, userID string) (int, error) {
	return s.notifRepo.CountUnread(ctx, userID)
}

// GetNotifications returns recent notifications for a user.
func (s *NotificationService) GetNotifications(ctx context.Context, userID string, limit int) ([]models.NotificationWithActor, error) {
	return s.notifRepo.ListByRecipient(ctx, userID, limit)
}

// MarkRead marks a single notification as read.
func (s *NotificationService) MarkRead(ctx context.Context, id, userID string) error {
	return s.notifRepo.MarkRead(ctx, id, userID)
}

// MarkAllRead marks all notifications as read for a user.
func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) (int, error) {
	return s.notifRepo.MarkAllRead(ctx, userID)
}

// UpsertPushSubscription saves or updates a browser push subscription.
func (s *NotificationService) UpsertPushSubscription(ctx context.Context, sub models.PushSubscription) error {
	return s.pushSubRepo.Upsert(ctx, sub)
}

// DeletePushSubscription removes a browser push subscription.
func (s *NotificationService) DeletePushSubscription(ctx context.Context, userID, endpoint string) error {
	return s.pushSubRepo.DeleteByUserAndEndpoint(ctx, userID, endpoint)
}

// GetVAPIDPublicKey returns the VAPID public key used for push subscription generation.
func (s *NotificationService) GetVAPIDPublicKey() string {
	return os.Getenv("VAPID_PUBLIC_KEY")
}

// generateText produces server-side title and body text for each event type.
func (s *NotificationService) generateText(event NotificationEvent) (string, string) {
	switch event.Type {
	case EventWorkspaceRenamed:
		name := s.metadataStr(event.Metadata, "name", "the workspace")
		return "Workspace renamed", fmt.Sprintf("The workspace was renamed to %q.", name)
	case EventSpaceCreated:
		name := s.metadataStr(event.Metadata, "name", "a space")
		return "Space created", fmt.Sprintf("A new space %q was created.", name)
	case EventSpaceRenamed:
		name := s.metadataStr(event.Metadata, "name", "a space")
		return "Space renamed", fmt.Sprintf("A space was renamed to %q.", name)
	case EventGroupMemberAdded:
		group := s.metadataStr(event.Metadata, "groupName", "a group")
		return "Added to group", fmt.Sprintf("You were added to the group %q.", group)
	case EventGroupMemberRemoved:
		group := s.metadataStr(event.Metadata, "groupName", "a group")
		return "Removed from group", fmt.Sprintf("You were removed from the group %q.", group)
	case EventRoleChanged:
		role := s.metadataStr(event.Metadata, "role", "member")
		return "Role changed", fmt.Sprintf("Your role was changed to %q.", role)
	case EventPageUpdated:
		name := s.metadataStr(event.Metadata, "name", "a page")
		return "Page updated", fmt.Sprintf("The page %q was updated.", name)
	case EventPageCreated:
		name := s.metadataStr(event.Metadata, "name", "a page")
		return "Page created", fmt.Sprintf("A new page %q was created.", name)
	case EventWorkspaceMemberAdded:
		wsName := s.metadataStr(event.Metadata, "name", "a workspace")
		return "Added to workspace", fmt.Sprintf("You were added to the workspace %q.", wsName)
	case EventSpaceMemberAdded:
		name := s.metadataStr(event.Metadata, "name", "a space")
		return "Added to space", fmt.Sprintf("You were added to the space %q.", name)
	case EventProfileAvatarUpdated:
		return "Avatar updated", "A user updated their profile avatar."
	default:
		return "Notification", "You have a new notification."
	}
}

func (s *NotificationService) metadataStr(meta map[string]string, key, fallback string) string {
	if v, ok := meta[key]; ok && v != "" {
		return v
	}
	return fallback
}

// deliverPush attempts to send a browser push notification to all of a user's subscriptions.
// Runs asynchronously; cleans up subscriptions that have become invalid.
func (s *NotificationService) deliverPush(ctx context.Context, userID string, notif models.Notification) {
	subs, err := s.pushSubRepo.ListByUser(ctx, userID)
	if err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("failed to list push subscriptions")
		return
	}
	if len(subs) == 0 {
		return
	}

	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")
	vapidPublicKey := os.Getenv("VAPID_PUBLIC_KEY")
	vapidSubject := os.Getenv("VAPID_SUBJECT")
	if vapidSubject == "" {
		vapidSubject = "mailto:admin@verso.local"
	}
	if vapidPrivateKey == "" || vapidPublicKey == "" {
		logger.Log.Warn().Msg("VAPID keys not configured; skipping browser push delivery")
		return
	}

	payload := map[string]string{
		"title": notif.Title,
		"body":  notif.Body,
		"type":  notif.Type,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to marshal push payload")
		return
	}

	for _, sub := range subs {
		wpSub := &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.P256DH,
				Auth:   sub.Auth,
			},
		}

		resp, err := webpush.SendNotification(payloadBytes, wpSub, &webpush.Options{
			Subscriber:      vapidSubject,
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             86400,
		})
		if err != nil {
			logger.Log.Warn().Err(err).Str("user_id", userID).Msg("browser push delivery failed")
			if resp != nil && (resp.StatusCode == 404 || resp.StatusCode == 410) {
				if delErr := s.pushSubRepo.DeleteByEndpoint(ctx, sub.Endpoint); delErr != nil {
					logger.Log.Error().Err(delErr).Msg("failed to clean up invalid push subscription")
				}
			}
		}
		if resp != nil {
			resp.Body.Close()
		}
	}
}
