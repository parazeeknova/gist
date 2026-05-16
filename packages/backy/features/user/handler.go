package user

import (
	"context"
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

func (h *UserHandlers) sharesWorkspace(ctx context.Context, currentUserID, targetUserID string) (bool, error) {
	workspaceRepo := repositories.NewWorkspaceRepo()
	currentWorkspaces, err := workspaceRepo.ListByUser(ctx, currentUserID)
	if err != nil {
		return false, err
	}
	targetWorkspaces, err := workspaceRepo.ListByUser(ctx, targetUserID)
	if err != nil {
		return false, err
	}
	for _, currentWorkspace := range currentWorkspaces {
		for _, targetWorkspace := range targetWorkspaces {
			if currentWorkspace.ID == targetWorkspace.ID {
				return true, nil
			}
		}
	}
	return false, nil
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

func (h *UserHandlers) GetUserByID(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "unauthenticated"})
		return
	}
	targetID := c.Param("id")
	user, err := repositories.NewUserRepo().GetUserByID(c.Request.Context(), targetID)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, auth.ErrorResponse{Error: "user not found"})
			return
		}
		logger.Log.Error().Err(err).Str("target_id", targetID).Msg("get user error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "internal server error"})
		return
	}

	userRepo := repositories.NewUserRepo()
	currentUser, err := userRepo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "unauthenticated"})
		return
	}

	// Admins and the target user receive the full record; other workspace peers
	// get a minimal safe response without email or account status.
	if currentUser.ID == user.ID || currentUser.Role == "owner" || currentUser.Role == "admin" {
		c.JSON(http.StatusOK, gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"name":       user.Name,
			"avatar_url": user.AvatarURL,
			"email":      user.Email,
			"role":       user.Role,
			"isOwner":    user.Role == "owner",
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
		})
		return
	}

	shared, err := h.sharesWorkspace(c.Request.Context(), currentUser.ID, user.ID)
	if err != nil {
		logger.Log.Error().Err(err).Str("current_user_id", currentUser.ID).Str("target_id", user.ID).Msg("workspace membership check error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "internal server error"})
		return
	}
	if !shared {
		c.JSON(http.StatusForbidden, auth.ErrorResponse{Error: "permission denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"name":       user.Name,
		"avatar_url": user.AvatarURL,
	})
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
