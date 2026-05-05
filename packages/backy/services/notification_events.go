package services

import "context"

// NotificationEventType identifies the kind of notification.
type NotificationEventType string

const (
	EventWorkspaceRenamed     NotificationEventType = "workspace.renamed"
	EventSpaceCreated         NotificationEventType = "space.created"
	EventSpaceRenamed         NotificationEventType = "space.renamed"
	EventGroupMemberAdded     NotificationEventType = "group.member_added"
	EventGroupMemberRemoved   NotificationEventType = "group.member_removed"
	EventRoleChanged          NotificationEventType = "role.changed"
	EventPageUpdated          NotificationEventType = "page.updated"
	EventPageCreated          NotificationEventType = "page.created"
	EventWorkspaceMemberAdded NotificationEventType = "workspace.member_added"
	EventSpaceMemberAdded     NotificationEventType = "space.member_added"
	EventProfileAvatarUpdated NotificationEventType = "profile.avatar_updated"
)

// NotificationEvent carries all data needed to create and deliver a notification.
type NotificationEvent struct {
	Type         NotificationEventType
	WorkspaceID  string
	ActorID      string
	RecipientIDs []string
	EntityType   string
	EntityID     string
	Metadata     map[string]string
}

// Notifier is the interface that domain services call to emit notification events.
type Notifier interface {
	Notify(ctx context.Context, event NotificationEvent)
}

// noopNotifier is used when notification service is not available.
type noopNotifier struct{}

func (n *noopNotifier) Notify(ctx context.Context, event NotificationEvent) {}

// NoopNotifier returns a notifier that does nothing.
func NoopNotifier() Notifier {
	return &noopNotifier{}
}
