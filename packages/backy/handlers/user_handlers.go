package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/auth"
	"verso/backy/logger"
	"verso/backy/middleware"
	"verso/backy/repositories"
)

// GetUsers handles GET /api/console/users.
func (h *Handlers) GetUsers(c *gin.Context) {
	users, err := repositories.NewUserRepo().ListUsers(c.Request.Context())
	if err != nil {
		logger.Log.Error().Err(err).Msg("list users error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to list users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// UpdateUserRole handles PUT /api/console/users/:id/role.
func (h *Handlers) UpdateUserRole(c *gin.Context) {
	currentUserID := middleware.GetCurrentUserID(c)
	if currentUserID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "unauthenticated"})
		return
	}

	// Prevent self-demotion
	targetID := c.Param("id")
	if targetID == currentUserID {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "cannot change your own role"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required,oneof=owner admin member"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: err.Error()})
		return
	}

	repo := repositories.NewUserRepo()
	if err := repo.UpdateUserRole(c.Request.Context(), targetID, req.Role); err != nil {
		logger.Log.Error().Err(err).Str("user_id", targetID).Msg("update user role error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// UpdateUserActive handles PUT /api/console/users/:id/active.
func (h *Handlers) UpdateUserActive(c *gin.Context) {
	currentUserID := middleware.GetCurrentUserID(c)
	if currentUserID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "unauthenticated"})
		return
	}

	// Prevent self-deactivation
	targetID := c.Param("id")
	if targetID == currentUserID {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "cannot deactivate yourself"})
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: err.Error()})
		return
	}

	repo := repositories.NewUserRepo()
	if err := repo.UpdateUserActive(c.Request.Context(), targetID, req.IsActive); err != nil {
		logger.Log.Error().Err(err).Str("user_id", targetID).Msg("update user active error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DeleteUser handles DELETE /api/console/users/:id.
func (h *Handlers) DeleteUser(c *gin.Context) {
	currentUserID := middleware.GetCurrentUserID(c)
	if currentUserID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "unauthenticated"})
		return
	}

	// Prevent self-deletion
	targetID := c.Param("id")
	if targetID == currentUserID {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "cannot delete yourself"})
		return
	}

	repo := repositories.NewUserRepo()
	if err := repo.DeleteUser(c.Request.Context(), targetID); err != nil {
		logger.Log.Error().Err(err).Str("user_id", targetID).Msg("delete user error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
