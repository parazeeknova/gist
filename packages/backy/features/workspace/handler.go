package workspace

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/database/models"
	"verso/backy/middleware"
	"verso/backy/shared/logger"
)

// --- Workspace Handlers ---

// GetWorkspaces handles GET /api/console/workspaces.
func (h *Handlers) GetWorkspaces(c *gin.Context) {
	if h.workspaceService == nil {
		c.JSON(http.StatusOK, []models.Workspace{})
		return
	}

	userID := middleware.GetCurrentUserID(c)
	workspaces, err := h.workspaceService.ListWorkspaces(c.Request.Context(), userID)
	if err != nil {
		logger.Log.Error().Err(err).Msg("list workspaces error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list workspaces"})
		return
	}

	c.JSON(http.StatusOK, workspaces)
}

// CreateWorkspaceRequest is the request body for creating a workspace.
type CreateWorkspaceRequest struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug" binding:"required"`
	Icon string `json:"icon"`
}

// CreateWorkspace handles POST /api/console/workspaces.
func (h *Handlers) CreateWorkspace(c *gin.Context) {
	if h.workspaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "workspace service unavailable"})
		return
	}

	var req CreateWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetCurrentUserID(c)
	workspace, err := h.workspaceService.CreateWorkspace(c.Request.Context(), req.Name, req.Slug, req.Icon, userID)
	if err != nil {
		logger.Log.Error().Err(err).Msg("create workspace error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create workspace"})
		return
	}

	c.JSON(http.StatusCreated, workspace)
}

// UpdateWorkspaceRequest is the request body for updating a workspace.
type UpdateWorkspaceRequest struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug" binding:"required"`
	Icon string `json:"icon"`
}

// UpdateWorkspace handles PUT /api/console/workspaces/:id.
func (h *Handlers) UpdateWorkspace(c *gin.Context) {
	if h.workspaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "workspace service unavailable"})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	var req UpdateWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workspace, err := h.workspaceService.UpdateWorkspace(c.Request.Context(), id, req.Name, req.Slug, req.Icon, userID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "workspace not found"})
			return
		}
		if errors.Is(err, ErrWorkspacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("update workspace error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update workspace"})
		return
	}

	c.JSON(http.StatusOK, workspace)
}

// DeleteWorkspace handles DELETE /api/console/workspaces/:id.
func (h *Handlers) DeleteWorkspace(c *gin.Context) {
	if h.workspaceService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "workspace service unavailable"})
		return
	}

	id := c.Param("id")
	userID := middleware.GetCurrentUserID(c)

	if err := h.workspaceService.DeleteWorkspace(c.Request.Context(), id, userID); err != nil {
		if errors.Is(err, ErrWorkspaceNotEmpty) {
			c.JSON(http.StatusConflict, gin.H{"error": "workspace is not empty, remove spaces first"})
			return
		}
		if errors.Is(err, ErrWorkspaceNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "workspace not found"})
			return
		}
		if errors.Is(err, ErrWorkspacePermissionDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		logger.Log.Error().Str("id", id).Err(err).Msg("delete workspace error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete workspace"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
