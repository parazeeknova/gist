package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"verso/backy/models"
	"verso/backy/repositories"
)

// ErrSpaceNotFound is returned when a space is not found.
var ErrSpaceNotFound = errors.New("space not found")

// ErrSpaceNotEmpty is returned when trying to delete a space that still has pages.
var ErrSpaceNotEmpty = errors.New("space is not empty")

// ErrSpacePermissionDenied is returned when a user lacks permission for an action.
var ErrSpacePermissionDenied = errors.New("permission denied for this space")

// SpaceService provides business logic for spaces.
type SpaceService struct {
	spaceRepo *repositories.SpaceRepo
	pageRepo  *repositories.PageRepo
}

// NewSpaceService creates a new space service.
func NewSpaceService(spaceRepo *repositories.SpaceRepo, pageRepo *repositories.PageRepo) *SpaceService {
	return &SpaceService{
		spaceRepo: spaceRepo,
		pageRepo:  pageRepo,
	}
}

// CreateSpace creates a new space within a workspace and adds the creator as owner.
func (s *SpaceService) CreateSpace(ctx context.Context, name, slug, icon, description, workspaceID, userID string) (models.Space, error) {
	space := models.Space{
		ID:          uuid.New().String(),
		Name:        name,
		Slug:        slug,
		Icon:        icon,
		Description: description,
		WorkspaceID: workspaceID,
		CreatedBy:   userID,
	}

	if err := s.spaceRepo.Insert(ctx, space); err != nil {
		return models.Space{}, fmt.Errorf("creating space: %w", err)
	}

	// Add creator as owner
	if err := s.spaceRepo.AddMember(ctx, space.ID, userID, "owner"); err != nil {
		return models.Space{}, fmt.Errorf("adding creator as owner: %w", err)
	}

	// Refresh member count
	space.MemberCount = 1

	return space, nil
}

// UpdateSpace updates an existing space. Requires admin or owner role.
func (s *SpaceService) UpdateSpace(ctx context.Context, id, name, slug, icon, description, userID string) (models.Space, error) {
	if err := s.requireAdminOrOwner(ctx, id, userID); err != nil {
		return models.Space{}, err
	}

	existing, err := s.spaceRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrSpaceNotFound) {
			return models.Space{}, ErrSpaceNotFound
		}
		return models.Space{}, fmt.Errorf("getting space: %w", err)
	}

	existing.Name = name
	existing.Slug = slug
	existing.Icon = icon
	existing.Description = description
	existing.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := s.spaceRepo.Update(ctx, existing); err != nil {
		return models.Space{}, fmt.Errorf("updating space: %w", err)
	}

	return existing, nil
}

// DeleteSpace deletes a space only if it has no pages. Requires owner role.
func (s *SpaceService) DeleteSpace(ctx context.Context, id, userID string) error {
	if err := s.requireOwner(ctx, id, userID); err != nil {
		return err
	}

	count, err := s.spaceRepo.PageCount(ctx, id)
	if err != nil {
		return fmt.Errorf("checking page count: %w", err)
	}
	if count > 0 {
		return ErrSpaceNotEmpty
	}

	if err := s.spaceRepo.Delete(ctx, id); err != nil {
		if errors.Is(err, repositories.ErrSpaceNotFound) {
			return ErrSpaceNotFound
		}
		return fmt.Errorf("deleting space: %w", err)
	}

	return nil
}

// ListSpaces returns all spaces in a workspace.
func (s *SpaceService) ListSpaces(ctx context.Context, workspaceID string) ([]models.Space, error) {
	spaces, err := s.spaceRepo.ListAll(ctx, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("listing spaces: %w", err)
	}
	return spaces, nil
}

// GetSpaceByID returns a space by ID.
func (s *SpaceService) GetSpaceByID(ctx context.Context, id string) (models.Space, error) {
	space, err := s.spaceRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrSpaceNotFound) {
			return models.Space{}, ErrSpaceNotFound
		}
		return models.Space{}, fmt.Errorf("getting space: %w", err)
	}
	return space, nil
}

// GetDefaultSpaceID returns the ID of the default space.
func (s *SpaceService) GetDefaultSpaceID(ctx context.Context) (string, error) {
	id, err := s.spaceRepo.GetDefaultSpaceID(ctx)
	if err != nil {
		return "", fmt.Errorf("getting default space id: %w", err)
	}
	return id, nil
}

// --- Role helpers ---

func (s *SpaceService) requireAdminOrOwner(ctx context.Context, spaceID, userID string) error {
	role, err := s.spaceRepo.GetMemberRole(ctx, spaceID, userID)
	if err != nil {
		return fmt.Errorf("checking role: %w", err)
	}
	if role == "owner" || role == "admin" {
		return nil
	}
	// Fallback: creator of the space always has owner access
	space, err := s.spaceRepo.GetByID(ctx, spaceID)
	if err != nil {
		return fmt.Errorf("checking creator: %w", err)
	}
	if space.CreatedBy == userID {
		return nil
	}
	return ErrSpacePermissionDenied
}

func (s *SpaceService) requireOwner(ctx context.Context, spaceID, userID string) error {
	role, err := s.spaceRepo.GetMemberRole(ctx, spaceID, userID)
	if err != nil {
		return fmt.Errorf("checking role: %w", err)
	}
	if role == "owner" {
		return nil
	}
	// Fallback: creator of the space always has owner access
	space, err := s.spaceRepo.GetByID(ctx, spaceID)
	if err != nil {
		return fmt.Errorf("checking creator: %w", err)
	}
	if space.CreatedBy == userID {
		return nil
	}
	return ErrSpacePermissionDenied
}

// --- Membership helpers ---

// GetSpaceMembers returns all members of a space.
func (s *SpaceService) GetSpaceMembers(ctx context.Context, spaceID string) ([]models.SpaceMember, error) {
	return s.spaceRepo.GetMembers(ctx, spaceID)
}

// GetSpaceMemberDetails returns all members of a space enriched with user details.
func (s *SpaceService) GetSpaceMemberDetails(ctx context.Context, spaceID string) ([]models.SpaceMemberWithUser, error) {
	return s.spaceRepo.GetMembersWithUsers(ctx, spaceID)
}

// AddSpaceMember adds a user to a space with a role.
func (s *SpaceService) AddSpaceMember(ctx context.Context, spaceID, userID, role, actorID string) error {
	if err := s.requireAdminOrOwner(ctx, spaceID, actorID); err != nil {
		return err
	}
	return s.spaceRepo.AddMember(ctx, spaceID, userID, role)
}

// UpdateSpaceMemberRole updates a user's role in a space.
func (s *SpaceService) UpdateSpaceMemberRole(ctx context.Context, spaceID, userID, role, actorID string) error {
	if err := s.requireAdminOrOwner(ctx, spaceID, actorID); err != nil {
		return err
	}
	return s.spaceRepo.UpdateMemberRole(ctx, spaceID, userID, role)
}

// RemoveSpaceMember removes a user from a space.
func (s *SpaceService) RemoveSpaceMember(ctx context.Context, spaceID, userID, actorID string) error {
	if err := s.requireAdminOrOwner(ctx, spaceID, actorID); err != nil {
		return err
	}
	return s.spaceRepo.RemoveMember(ctx, spaceID, userID)
}
