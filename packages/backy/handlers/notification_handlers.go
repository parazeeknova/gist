package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/logger"
	"verso/backy/middleware"
	"verso/backy/services"
)

// NotificationHandlers holds HTTP handlers for notification endpoints.
type NotificationHandlers struct {
	notificationService *services.NotificationService
}

// NewNotificationHandlers creates a new NotificationHandlers.
func NewNotificationHandlers(notificationService *services.NotificationService) *NotificationHandlers {
	return &NotificationHandlers{notificationService: notificationService}
}

// RegisterRoutes registers all notification routes on the given router group.
func (h *NotificationHandlers) RegisterRoutes(rg *gin.RouterGroup) {
	notifGroup := rg.Group("/notifications")
	{
		notifGroup.GET("", h.ListNotifications)
		notifGroup.GET("/unread-count", h.UnreadCount)
		notifGroup.PUT("/:id/read", h.MarkRead)
		notifGroup.PUT("/read-all", h.MarkAllRead)
	}
}

// ListNotifications returns recent notifications for the current user.
func (h *NotificationHandlers) ListNotifications(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	notifs, err := h.notificationService.GetNotifications(c.Request.Context(), userID, 50)
	if err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("list notifications error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list notifications"})
		return
	}

	c.JSON(http.StatusOK, notifs)
}

// UnreadCount returns the count of unread notifications.
func (h *NotificationHandlers) UnreadCount(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	count, err := h.notificationService.CountUnread(c.Request.Context(), userID)
	if err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("unread count error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkRead marks a single notification as read.
func (h *NotificationHandlers) MarkRead(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")
	if err := h.notificationService.MarkRead(c.Request.Context(), id, userID); err != nil {
		logger.Log.Error().Err(err).Str("id", id).Msg("mark read error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// MarkAllRead marks all notifications as read for the current user.
func (h *NotificationHandlers) MarkAllRead(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	count, err := h.notificationService.MarkAllRead(c.Request.Context(), userID)
	if err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("mark all read error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}
