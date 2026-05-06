package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"verso/backy/database"
	"verso/backy/models"
	"verso/backy/repositories"
)

var (
	ErrWorkspaceNotFound         = errors.New("workspace not found")
	ErrWorkspaceNotEmpty         = errors.New("workspace is not empty")
	ErrWorkspacePermissionDenied = errors.New("permission denied for this workspace")
)

// WorkspaceService provides business logic for workspaces.
type WorkspaceService struct {
	workspaceRepo *repositories.WorkspaceRepo
	spaceRepo     *repositories.SpaceRepo
	groupRepo     *repositories.GroupRepo
	notifier      Notifier
}

// NewWorkspaceService creates a new workspace service.
func NewWorkspaceService(workspaceRepo *repositories.WorkspaceRepo, spaceRepo *repositories.SpaceRepo, groupRepo *repositories.GroupRepo) *WorkspaceService {
	return &WorkspaceService{
		workspaceRepo: workspaceRepo,
		spaceRepo:     spaceRepo,
		groupRepo:     groupRepo,
		notifier:      NoopNotifier(),
	}
}

// SetNotifier sets the notification service on the workspace service.
func (s *WorkspaceService) SetNotifier(n Notifier) {
	s.notifier = n
}

// CreateWorkspace creates a new workspace with a default group, default space, and memberships atomically.
func (s *WorkspaceService) CreateWorkspace(ctx context.Context, name, slug, icon, userID string) (models.Workspace, error) {
	w := models.Workspace{
		ID:       uuid.New().String(),
		Name:     name,
		Slug:     slug,
		Icon:     icon,
		Settings: "{}",
	}

	defaultGroup := models.Group{
		ID:          uuid.New().String(),
		WorkspaceID: w.ID,
		Name:        "Everyone",
		Description: "All workspace members",
		IsDefault:   true,
		CreatorID:   userID,
	}

	space := models.Space{
		ID:          uuid.New().String(),
		Name:        "notes",
		Slug:        "notes",
		WorkspaceID: w.ID,
		CreatedBy:   userID,
		Visibility:  "private",
		DefaultRole: models.SpaceRoleReader,
		Settings:    "{}",
	}

	pool := database.GetPool()
	tx, err := pool.Begin(ctx)
	if err != nil {
		return models.Workspace{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := s.workspaceRepo.InsertTx(ctx, tx, w); err != nil {
		return models.Workspace{}, fmt.Errorf("creating workspace: %w", err)
	}

	if err := s.workspaceRepo.AddMemberTx(ctx, tx, w.ID, userID, "owner"); err != nil {
		return models.Workspace{}, fmt.Errorf("adding creator as workspace owner: %w", err)
	}

	if err := s.groupRepo.InsertTx(ctx, tx, defaultGroup); err != nil {
		return models.Workspace{}, fmt.Errorf("creating default group: %w", err)
	}

	if err := s.groupRepo.AddUserTx(ctx, tx, defaultGroup.ID, userID); err != nil {
		return models.Workspace{}, fmt.Errorf("adding creator to default group: %w", err)
	}

	if err := s.spaceRepo.InsertTx(ctx, tx, space); err != nil {
		return models.Workspace{}, fmt.Errorf("creating default space: %w", err)
	}

	// Add default group to default space as writer.
	if err := s.spaceRepo.AddGroupMemberTx(ctx, tx, space.ID, defaultGroup.ID, models.SpaceRoleWriter); err != nil {
		return models.Workspace{}, fmt.Errorf("adding default group to space: %w", err)
	}

	// Add creator directly to default space as admin (highest role wins).
	if err := s.spaceRepo.AddMemberTx(ctx, tx, space.ID, userID, models.SpaceRoleAdmin); err != nil {
		return models.Workspace{}, fmt.Errorf("adding creator to default space: %w", err)
	}

	if err := s.workspaceRepo.SetDefaultSpaceIDTx(ctx, tx, w.ID, space.ID); err != nil {
		return models.Workspace{}, fmt.Errorf("setting default space id: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return models.Workspace{}, fmt.Errorf("commit tx: %w", err)
	}

	w.DefaultSpaceID = space.ID
	w.MemberCount = 1

	return w, nil
}

// UpdateWorkspace updates an existing workspace.
func (s *WorkspaceService) UpdateWorkspace(ctx context.Context, id, name, slug, icon, userID string) (models.Workspace, error) {
	if err := s.requireWorkspaceOwner(ctx, id, userID); err != nil {
		return models.Workspace{}, err
	}

	existing, err := s.workspaceRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrWorkspaceNotFound) {
			return models.Workspace{}, ErrWorkspaceNotFound
		}
		return models.Workspace{}, fmt.Errorf("getting workspace: %w", err)
	}

	oldName := existing.Name
	oldIcon := existing.Icon

	existing.Name = name
	existing.Slug = slug
	existing.Icon = icon

	if err := s.workspaceRepo.Update(ctx, existing); err != nil {
		return models.Workspace{}, fmt.Errorf("updating workspace: %w", err)
	}

	nameChanged := oldName != name
	iconChanged := oldIcon != icon

	recipients, _ := s.workspaceMemberIDs(ctx, id)
	if iconChanged && !nameChanged {
		s.notifier.Notify(ctx, NotificationEvent{
			Type:         EventWorkspaceIconChanged,
			WorkspaceID:  id,
			ActorID:      userID,
			RecipientIDs: recipients,
			Metadata:     map[string]string{"name": name},
		})
	} else if nameChanged {
		s.notifier.Notify(ctx, NotificationEvent{
			Type:         EventWorkspaceRenamed,
			WorkspaceID:  id,
			ActorID:      userID,
			RecipientIDs: recipients,
			Metadata:     map[string]string{"name": name},
		})
	}

	return existing, nil
}

func (s *WorkspaceService) workspaceMemberIDs(ctx context.Context, workspaceID string) ([]string, error) {
	members, err := s.workspaceRepo.GetMembers(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(members))
	for _, m := range members {
		ids = append(ids, m.UserID)
	}
	return ids, nil
}

// DeleteWorkspace soft-deletes a workspace only if it has no non-deleted spaces.
func (s *WorkspaceService) DeleteWorkspace(ctx context.Context, id, userID string) error {
	if err := s.requireWorkspaceOwner(ctx, id, userID); err != nil {
		return err
	}

	count, err := s.workspaceRepo.SpaceCount(ctx, id)
	if err != nil {
		return fmt.Errorf("checking space count: %w", err)
	}
	if count > 0 {
		return ErrWorkspaceNotEmpty
	}

	ws, _ := s.workspaceRepo.GetByID(ctx, id)
	recipients, _ := s.workspaceMemberIDs(ctx, id)

	if err := s.workspaceRepo.SoftDelete(ctx, id); err != nil {
		if errors.Is(err, repositories.ErrWorkspaceNotFound) {
			return ErrWorkspaceNotFound
		}
		return fmt.Errorf("deleting workspace: %w", err)
	}

	wsName := id
	if ws.Name != "" {
		wsName = ws.Name
	}
	s.notifier.Notify(ctx, NotificationEvent{
		Type:         EventWorkspaceDeleted,
		WorkspaceID:  id,
		ActorID:      userID,
		RecipientIDs: recipients,
		Metadata:     map[string]string{"name": wsName},
	})

	return nil
}

// ListWorkspaces returns all workspaces the user is a member of.
func (s *WorkspaceService) ListWorkspaces(ctx context.Context, userID string) ([]models.Workspace, error) {
	workspaces, err := s.workspaceRepo.ListByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("listing workspaces: %w", err)
	}
	return workspaces, nil
}

// GetWorkspaceByID returns a workspace by ID.
func (s *WorkspaceService) GetWorkspaceByID(ctx context.Context, id string) (models.Workspace, error) {
	workspace, err := s.workspaceRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrWorkspaceNotFound) {
			return models.Workspace{}, ErrWorkspaceNotFound
		}
		return models.Workspace{}, fmt.Errorf("getting workspace: %w", err)
	}
	return workspace, nil
}

// GetDefaultWorkspaceID returns the ID of the default workspace.
func (s *WorkspaceService) GetDefaultWorkspaceID(ctx context.Context) (string, error) {
	id, err := s.workspaceRepo.GetDefaultWorkspaceID(ctx)
	if err != nil {
		return "", fmt.Errorf("getting default workspace id: %w", err)
	}
	return id, nil
}

func (s *WorkspaceService) requireWorkspaceOwner(ctx context.Context, workspaceID, userID string) error {
	role, err := s.workspaceRepo.GetMemberRole(ctx, workspaceID, userID)
	if err != nil {
		return fmt.Errorf("checking workspace role: %w", err)
	}
	if role == "owner" {
		return nil
	}
	return ErrWorkspacePermissionDenied
}

// RequireMembership checks if a user is a member of a workspace.
func (s *WorkspaceService) RequireMembership(ctx context.Context, workspaceID, userID string) error {
	isMember, err := s.workspaceRepo.IsMember(ctx, workspaceID, userID)
	if err != nil {
		return fmt.Errorf("checking workspace membership: %w", err)
	}
	if !isMember {
		return ErrWorkspacePermissionDenied
	}
	return nil
}

// RequireOwnerOrAdmin checks if a user is an owner or admin of a workspace.
func (s *WorkspaceService) RequireOwnerOrAdmin(ctx context.Context, workspaceID, userID string) error {
	role, err := s.workspaceRepo.GetMemberRole(ctx, workspaceID, userID)
	if err != nil {
		return fmt.Errorf("checking workspace role: %w", err)
	}
	if role == "owner" || role == "admin" {
		return nil
	}
	return ErrWorkspacePermissionDenied
}

// AddWorkspaceMember adds a user to a workspace and the default group.
func (s *WorkspaceService) AddWorkspaceMember(ctx context.Context, workspaceID, userID, role string) error {
	if err := s.workspaceRepo.AddMember(ctx, workspaceID, userID, role); err != nil {
		return fmt.Errorf("adding workspace member: %w", err)
	}
	if s.groupRepo != nil {
		defaultGroupID, err := s.groupRepo.GetDefaultGroupID(ctx, workspaceID)
		if err != nil {
			return fmt.Errorf("finding default group: %w", err)
		}
		if err := s.groupRepo.AddUser(ctx, defaultGroupID, userID); err != nil {
			return fmt.Errorf("adding to default group: %w", err)
		}
	}

	ws, _ := s.workspaceRepo.GetByID(ctx, workspaceID)
	wsName := "a workspace"
	if ws.Name != "" {
		wsName = ws.Name
	}
	s.notifier.Notify(ctx, NotificationEvent{
		Type:         EventWorkspaceMemberAdded,
		WorkspaceID:  workspaceID,
		ActorID:      userID,
		RecipientIDs: []string{userID},
		Metadata:     map[string]string{"name": wsName},
	})
	return nil
}
