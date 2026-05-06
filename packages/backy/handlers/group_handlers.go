package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/logger"
	"verso/backy/middleware"
	"verso/backy/services"
)

// --- Group Handlers ---

// GetGroups handles GET /api/console/workspaces/:workspaceId/groups.
func (h *Handlers) GetGroups(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusOK, gin.H{"groups": []any{}})
		return
	}

	workspaceID := c.Param("workspaceId")
	userID := middleware.GetCurrentUserID(c)

	if err := h.workspaceService.RequireMembership(c.Request.Context(), workspaceID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
		return
	}

	groups, err := h.groupService.ListGroups(c.Request.Context(), workspaceID)
	if err != nil {
		logger.Log.Error().Err(err).Msg("list groups error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list groups"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"groups": groups})
}

// CreateGroupRequest is the request body for creating a group.
type CreateGroupRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// CreateGroup handles POST /api/console/workspaces/:workspaceId/groups.
func (h *Handlers) CreateGroup(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "group service unavailable"})
		return
	}

	workspaceID := c.Param("workspaceId")
	userID := middleware.GetCurrentUserID(c)

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group, err := h.groupService.CreateGroup(c.Request.Context(), workspaceID, req.Name, req.Description, userID)
	if err != nil {
		if errors.Is(err, services.ErrGroupPermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Err(err).Msg("create group error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create group"})
		return
	}

	c.JSON(http.StatusCreated, group)
}

// UpdateGroupRequest is the request body for updating a group.
type UpdateGroupRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// UpdateGroup handles PUT /api/console/groups/:id.
func (h *Handlers) UpdateGroup(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "group service unavailable"})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	var req UpdateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group, err := h.groupService.UpdateGroup(c.Request.Context(), id, req.Name, req.Description, userID)
	if err != nil {
		if errors.Is(err, services.ErrGroupNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
			return
		}
		if errors.Is(err, services.ErrGroupPermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if errors.Is(err, services.ErrDefaultGroupImmutable) {
			c.JSON(http.StatusConflict, gin.H{"error": "default group cannot be modified"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("update group error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update group"})
		return
	}

	c.JSON(http.StatusOK, group)
}

// DeleteGroup handles DELETE /api/console/groups/:id.
func (h *Handlers) DeleteGroup(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "group service unavailable"})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	if err := h.groupService.DeleteGroup(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, services.ErrGroupNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
			return
		}
		if errors.Is(err, services.ErrGroupPermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if errors.Is(err, services.ErrDefaultGroupImmutable) {
			c.JSON(http.StatusConflict, gin.H{"error": "default group cannot be deleted"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("delete group error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// GetGroupMembers handles GET /api/console/groups/:id/members.
func (h *Handlers) GetGroupMembers(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusOK, gin.H{"members": []any{}})
		return
	}

	id := c.Param("id")
	actorID := middleware.GetCurrentUserID(c)
	members, err := h.groupService.GetGroupMembers(c.Request.Context(), id, actorID)
	if err != nil {
		if errors.Is(err, services.ErrGroupPermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if errors.Is(err, services.ErrGroupNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("list group members error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list group members"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"members": members})
}

// AddGroupMemberRequest is the request body for adding a member to a group.
type AddGroupMemberRequest struct {
	UserID string `json:"userId" binding:"required"`
}

// AddGroupMember handles POST /api/console/groups/:id/members.
func (h *Handlers) AddGroupMember(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "group service unavailable"})
		return
	}

	groupID := c.Param("id")
	actorID := middleware.GetCurrentUserID(c)

	var req AddGroupMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.groupService.AddGroupMember(c.Request.Context(), groupID, req.UserID, actorID); err != nil {
		if errors.Is(err, services.ErrGroupNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
			return
		}
		if errors.Is(err, services.ErrGroupPermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("groupId", groupID).Str("userId", req.UserID).Err(err).Msg("add group member error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add group member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "added"})
}

// RemoveGroupMember handles DELETE /api/console/groups/:id/members/:userId.
func (h *Handlers) RemoveGroupMember(c *gin.Context) {
	if h.groupService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "group service unavailable"})
		return
	}

	groupID := c.Param("id")
	userID := c.Param("userId")
	actorID := middleware.GetCurrentUserID(c)

	if err := h.groupService.RemoveGroupMember(c.Request.Context(), groupID, userID, actorID); err != nil {
		if errors.Is(err, services.ErrGroupNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
			return
		}
		if errors.Is(err, services.ErrGroupPermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		if errors.Is(err, services.ErrDefaultGroupImmutable) {
			c.JSON(http.StatusConflict, gin.H{"error": "default group members cannot be removed"})
			return
		}
		logger.Log.Error().Str("groupId", groupID).Str("userId", userID).Err(err).Msg("remove group member error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove group member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "removed"})
}
