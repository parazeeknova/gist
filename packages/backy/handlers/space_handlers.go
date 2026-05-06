package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"verso/backy/logger"
	"verso/backy/middleware"
	"verso/backy/models"
	"verso/backy/services"
)

// --- Space Handlers ---

// GetSpaces handles GET /api/console/spaces.
func (h *Handlers) GetSpaces(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusOK, []models.Space{})
		return
	}

	workspaceID := c.Query("workspaceId")
	if workspaceID == "" {
		c.JSON(http.StatusOK, []models.Space{})
		return
	}

	userID := middleware.GetCurrentUserID(c)
	if err := h.workspaceService.RequireMembership(c.Request.Context(), workspaceID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
		return
	}

	spaces, err := h.spaceService.ListSpaces(c.Request.Context(), workspaceID)
	if err != nil {
		logger.Log.Error().Err(err).Msg("list spaces error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list spaces"})
		return
	}

	c.JSON(http.StatusOK, spaces)
}

// CreateSpaceRequest is the request body for creating a space.
type CreateSpaceRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
	WorkspaceID string `json:"workspaceId" binding:"required"`
}

// CreateSpace handles POST /api/console/spaces.
func (h *Handlers) CreateSpace(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	var req CreateSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetCurrentUserID(c)
	if err := h.workspaceService.RequireOwnerOrAdmin(c.Request.Context(), req.WorkspaceID, userID); err != nil {
		if errors.Is(err, services.ErrWorkspacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Err(err).Msg("create space permission check error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create space"})
		return
	}

	space, err := h.spaceService.CreateSpace(c.Request.Context(), req.Name, req.Slug, req.Icon, req.Description, req.WorkspaceID, userID)
	if err != nil {
		logger.Log.Error().Err(err).Msg("create space error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create space"})
		return
	}

	c.JSON(http.StatusCreated, space)
}

// UpdateSpaceRequest is the request body for updating a space.
type UpdateSpaceRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
}

// UpdateSpace handles PUT /api/console/spaces/:id.
func (h *Handlers) UpdateSpace(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	var req UpdateSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	space, err := h.spaceService.UpdateSpace(c.Request.Context(), id, req.Name, req.Slug, req.Icon, req.Description, userID)
	if err != nil {
		if errors.Is(err, services.ErrSpaceNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "space not found"})
			return
		}
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("update space error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update space"})
		return
	}

	c.JSON(http.StatusOK, space)
}

// DeleteSpace handles DELETE /api/console/spaces/:id.
func (h *Handlers) DeleteSpace(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	if err := h.spaceService.DeleteSpace(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, services.ErrSpaceNotEmpty) {
			c.JSON(http.StatusConflict, gin.H{"error": "space is not empty, remove pages first"})
			return
		}
		if errors.Is(err, services.ErrSpaceNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "space not found"})
			return
		}
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("delete space error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete space"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// GetSpaceMembers handles GET /api/console/spaces/:id/members.
func (h *Handlers) GetSpaceMembers(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusOK, []models.SpaceMemberMixed{})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	if err := h.spaceService.RequireRead(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("space members permission check error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list space members"})
		return
	}

	members, err := h.spaceService.GetSpaceMembersMixed(c.Request.Context(), id)
	if err != nil {
		logger.Log.Error().Str("id", id).Err(err).Msg("list space members error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list space members"})
		return
	}

	c.JSON(http.StatusOK, members)
}

// UpdateSpaceMemberRequest is the request body for updating a member's role.
type UpdateSpaceMemberRequest struct {
	Role string `json:"role" binding:"required"`
}

// UpdateSpaceMemberRole handles PUT /api/console/spaces/:id/members/:userId.
func (h *Handlers) UpdateSpaceMemberRole(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	spaceID := c.Param("id")
	userID := c.Param("userId")
	actorID := middleware.GetCurrentUserID(c)

	var req UpdateSpaceMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.spaceService.UpdateSpaceMemberRole(c.Request.Context(), spaceID, userID, req.Role, actorID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if strings.Contains(err.Error(), "invalid role") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logger.Log.Error().Str("spaceId", spaceID).Str("userId", userID).Err(err).Msg("update space member role error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update member role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// RemoveSpaceMember handles DELETE /api/console/spaces/:id/members/:userId.
func (h *Handlers) RemoveSpaceMember(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	spaceID := c.Param("id")
	userID := c.Param("userId")
	actorID := middleware.GetCurrentUserID(c)

	if err := h.spaceService.RemoveSpaceMember(c.Request.Context(), spaceID, userID, actorID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("spaceId", spaceID).Str("userId", userID).Err(err).Msg("remove space member error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "removed"})
}

// AddSpaceMember handles POST /api/console/spaces/:id/members/:userId.
func (h *Handlers) AddSpaceMember(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	spaceID := c.Param("id")
	userID := c.Param("userId")
	actorID := middleware.GetCurrentUserID(c)

	var req UpdateSpaceMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.spaceService.AddSpaceMember(c.Request.Context(), spaceID, userID, req.Role, actorID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("spaceId", spaceID).Str("userId", userID).Err(err).Msg("add space member error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "added"})
}

// AddSpaceGroupRequest is the request body for adding a group to a space.
type AddSpaceGroupRequest struct {
	Role string `json:"role" binding:"required"`
}

// AddSpaceGroup handles POST /api/console/spaces/:id/groups/:groupId.
func (h *Handlers) AddSpaceGroup(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	spaceID := c.Param("id")
	groupID := c.Param("groupId")
	actorID := middleware.GetCurrentUserID(c)

	var req AddSpaceGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.spaceService.AddSpaceGroup(c.Request.Context(), spaceID, groupID, req.Role, actorID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if strings.Contains(err.Error(), "invalid role") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "group does not belong") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logger.Log.Error().Str("spaceId", spaceID).Str("groupId", groupID).Err(err).Msg("add space group error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add group to space"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "added"})
}

// UpdateSpaceGroupRole handles PUT /api/console/spaces/:id/groups/:groupId.
func (h *Handlers) UpdateSpaceGroupRole(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	spaceID := c.Param("id")
	groupID := c.Param("groupId")
	actorID := middleware.GetCurrentUserID(c)

	var req UpdateSpaceMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.spaceService.UpdateSpaceGroupRole(c.Request.Context(), spaceID, groupID, req.Role, actorID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if strings.Contains(err.Error(), "invalid role") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logger.Log.Error().Str("spaceId", spaceID).Str("groupId", groupID).Err(err).Msg("update space group role error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update group role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// RemoveSpaceGroup handles DELETE /api/console/spaces/:id/groups/:groupId.
func (h *Handlers) RemoveSpaceGroup(c *gin.Context) {
	if h.spaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "space service unavailable"})
		return
	}

	spaceID := c.Param("id")
	groupID := c.Param("groupId")
	actorID := middleware.GetCurrentUserID(c)

	if err := h.spaceService.RemoveSpaceGroup(c.Request.Context(), spaceID, groupID, actorID); err != nil {
		if errors.Is(err, services.ErrSpacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("spaceId", spaceID).Str("groupId", groupID).Err(err).Msg("remove space group error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove group from space"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "removed"})
}
