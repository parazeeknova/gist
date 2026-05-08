package user

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/middleware"
	"verso/backy/repositories"
	"verso/backy/shared/auth"
	"verso/backy/shared/logger"
)

type UserHandlers struct{}

func NewUserHandlers() *UserHandlers {
	return &UserHandlers{}
}

func (h *UserHandlers) requireOwnerOrAdmin(c *gin.Context) error {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		return errors.New("unauthenticated")
	}
	user, err := repositories.NewUserRepo().GetUserByID(c.Request.Context(), userID)
	if err != nil {
		return err
	}
	if user.Role != "owner" && user.Role != "admin" {
		return errors.New("insufficient permissions")
	}
	return nil
}

func (h *UserHandlers) GetUsers(c *gin.Context) {
	if err := h.requireOwnerOrAdmin(c); err != nil {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "permission denied"})
		return
	}
	users, err := repositories.NewUserRepo().ListUsers(c.Request.Context())
	if err != nil {
		logger.Log.Error().Err(err).Msg("list users error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to list users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserHandlers) UpdateUserRole(c *gin.Context) {
	if err := h.requireOwnerOrAdmin(c); err != nil {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "permission denied"})
		return
	}
	userID := middleware.GetCurrentUserID(c)
	targetID := c.Param("id")
	if userID == targetID {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "cannot change your own role"})
		return
	}
	var req struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Role == "" {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "role is required"})
		return
	}
	if req.Role != "owner" && req.Role != "admin" && req.Role != "member" {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "invalid role"})
		return
	}
	if err := repositories.NewUserRepo().UpdateUserRole(c.Request.Context(), targetID, req.Role); err != nil {
		logger.Log.Error().Err(err).Str("user_id", targetID).Msg("update user role error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to update role"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *UserHandlers) UpdateUserActive(c *gin.Context) {
	if err := h.requireOwnerOrAdmin(c); err != nil {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "permission denied"})
		return
	}
	userID := middleware.GetCurrentUserID(c)
	targetID := c.Param("id")
	if userID == targetID {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "cannot change your own active status"})
		return
	}
	var req struct {
		IsActive *bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.IsActive == nil {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "is_active is required"})
		return
	}
	if err := repositories.NewUserRepo().UpdateUserActive(c.Request.Context(), targetID, *req.IsActive); err != nil {
		logger.Log.Error().Err(err).Str("user_id", targetID).Msg("update user active error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to update status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *UserHandlers) DeleteUser(c *gin.Context) {
	if err := h.requireOwnerOrAdmin(c); err != nil {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "permission denied"})
		return
	}
	userID := middleware.GetCurrentUserID(c)
	targetID := c.Param("id")
	if userID == targetID {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "cannot delete your own account"})
		return
	}
	if err := repositories.NewUserRepo().DeleteUser(c.Request.Context(), targetID); err != nil {
		logger.Log.Error().Err(err).Str("user_id", targetID).Msg("delete user error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to delete user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
