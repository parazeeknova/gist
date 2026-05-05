package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"verso/backy/models"
	"verso/backy/repositories"
)

var (
	ErrGroupNotFound         = errors.New("group not found")
	ErrGroupPermissionDenied = errors.New("permission denied for this group")
	ErrDefaultGroupImmutable = errors.New("default group cannot be modified or deleted")
)

// GroupService provides business logic for groups.
type GroupService struct {
	groupRepo     *repositories.GroupRepo
	workspaceRepo *repositories.WorkspaceRepo
}

// NewGroupService creates a new group service.
func NewGroupService(groupRepo *repositories.GroupRepo, workspaceRepo *repositories.WorkspaceRepo) *GroupService {
	return &GroupService{
		groupRepo:     groupRepo,
		workspaceRepo: workspaceRepo,
	}
}

// CreateGroup creates a new group in a workspace. Requires workspace owner or admin.
func (s *GroupService) CreateGroup(ctx context.Context, workspaceID, name, description, userID string) (models.Group, error) {
	if err := s.requireWorkspaceOwnerOrAdmin(ctx, workspaceID, userID); err != nil {
		return models.Group{}, err
	}

	g := models.Group{
		ID:          uuid.New().String(),
		WorkspaceID: workspaceID,
		Name:        name,
		Description: description,
		IsDefault:   false,
		CreatorID:   userID,
	}

	if err := s.groupRepo.Insert(ctx, g); err != nil {
		return models.Group{}, fmt.Errorf("creating group: %w", err)
	}

	return g, nil
}

// UpdateGroup updates a group's name and description. Requires workspace owner or admin.
func (s *GroupService) UpdateGroup(ctx context.Context, id, name, description, userID string) (models.Group, error) {
	g, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrGroupNotFound) {
			return models.Group{}, ErrGroupNotFound
		}
		return models.Group{}, fmt.Errorf("getting group: %w", err)
	}

	if err := s.requireWorkspaceOwnerOrAdmin(ctx, g.WorkspaceID, userID); err != nil {
		return models.Group{}, err
	}

	if g.IsDefault {
		return models.Group{}, ErrDefaultGroupImmutable
	}

	g.Name = name
	g.Description = description

	if err := s.groupRepo.Update(ctx, g); err != nil {
		return models.Group{}, fmt.Errorf("updating group: %w", err)
	}

	return g, nil
}

// DeleteGroup soft-deletes a non-default group. Requires workspace owner or admin.
func (s *GroupService) DeleteGroup(ctx context.Context, id, userID string) error {
	g, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrGroupNotFound) {
			return ErrGroupNotFound
		}
		return fmt.Errorf("getting group: %w", err)
	}

	if err := s.requireWorkspaceOwnerOrAdmin(ctx, g.WorkspaceID, userID); err != nil {
		return err
	}

	if g.IsDefault {
		return ErrDefaultGroupImmutable
	}

	if err := s.groupRepo.SoftDelete(ctx, id); err != nil {
		return fmt.Errorf("deleting group: %w", err)
	}

	return nil
}

// ListGroups returns all groups in a workspace.
func (s *GroupService) ListGroups(ctx context.Context, workspaceID string) ([]models.Group, error) {
	groups, err := s.groupRepo.ListByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("listing groups: %w", err)
	}
	return groups, nil
}

// GetGroupByID returns a group by ID.
func (s *GroupService) GetGroupByID(ctx context.Context, id string) (models.Group, error) {
	g, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrGroupNotFound) {
			return models.Group{}, ErrGroupNotFound
		}
		return models.Group{}, fmt.Errorf("getting group: %w", err)
	}
	return g, nil
}

// GetDefaultGroupID returns the default group ID for a workspace.
func (s *GroupService) GetDefaultGroupID(ctx context.Context, workspaceID string) (string, error) {
	id, err := s.groupRepo.GetDefaultGroupID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, repositories.ErrGroupNotFound) {
			return "", ErrGroupNotFound
		}
		return "", fmt.Errorf("getting default group: %w", err)
	}
	return id, nil
}

// --- Membership helpers ---

// AddGroupMember adds a user to a group. Requires workspace owner or admin.
func (s *GroupService) AddGroupMember(ctx context.Context, groupID, memberUserID, actorID string) error {
	g, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		if errors.Is(err, repositories.ErrGroupNotFound) {
			return ErrGroupNotFound
		}
		return fmt.Errorf("getting group: %w", err)
	}

	if err := s.requireWorkspaceOwnerOrAdmin(ctx, g.WorkspaceID, actorID); err != nil {
		return err
	}

	return s.groupRepo.AddUser(ctx, groupID, memberUserID)
}

// RemoveGroupMember removes a user from a non-default group. Requires workspace owner or admin.
func (s *GroupService) RemoveGroupMember(ctx context.Context, groupID, memberUserID, actorID string) error {
	g, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		if errors.Is(err, repositories.ErrGroupNotFound) {
			return ErrGroupNotFound
		}
		return fmt.Errorf("getting group: %w", err)
	}

	if err := s.requireWorkspaceOwnerOrAdmin(ctx, g.WorkspaceID, actorID); err != nil {
		return err
	}

	if g.IsDefault {
		return ErrDefaultGroupImmutable
	}

	return s.groupRepo.RemoveUser(ctx, groupID, memberUserID)
}

// GetGroupMembers returns all members of a group.
func (s *GroupService) GetGroupMembers(ctx context.Context, groupID string) ([]models.GroupMemberWithUser, error) {
	return s.groupRepo.GetMembersWithUsers(ctx, groupID)
}

// AddUserToDefaultGroup adds a user to the default group of a workspace.
func (s *GroupService) AddUserToDefaultGroup(ctx context.Context, workspaceID, userID string) error {
	groupID, err := s.groupRepo.GetDefaultGroupID(ctx, workspaceID)
	if err != nil {
		return fmt.Errorf("getting default group for workspace %q: %w", workspaceID, err)
	}
	return s.groupRepo.AddUser(ctx, groupID, userID)
}

func (s *GroupService) requireWorkspaceOwnerOrAdmin(ctx context.Context, workspaceID, userID string) error {
	role, err := s.workspaceRepo.GetMemberRole(ctx, workspaceID, userID)
	if err != nil {
		return fmt.Errorf("checking workspace role: %w", err)
	}
	if role == "owner" || role == "admin" {
		return nil
	}
	return ErrGroupPermissionDenied
}
