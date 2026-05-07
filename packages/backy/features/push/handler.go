package push

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"verso/backy/database/models"
	"verso/backy/middleware"
	"verso/backy/shared/logger"
)

// PushSubscriptionHandlers holds HTTP handlers for browser push subscription management.
type PushSubscriptionHandlers struct {
	notificationService *notifeat.NotificationService
}

// NewPushSubscriptionHandlers creates a new PushSubscriptionHandlers.
func NewPushSubscriptionHandlers(notificationService *notifeat.NotificationService) *PushSubscriptionHandlers {
	return &PushSubscriptionHandlers{notificationService: notificationService}
}

// RegisterRoutes registers push subscription routes.
func (h *PushSubscriptionHandlers) RegisterRoutes(rg *gin.RouterGroup) {
	pushGroup := rg.Group("/push")
	{
		pushGroup.POST("/subscribe", h.Subscribe)
		pushGroup.DELETE("/unsubscribe", h.Unsubscribe)
		pushGroup.GET("/public-key", h.PublicKey)
	}
}

// SubscribeRequest is the request body for saving a push subscription.
type SubscribeRequest struct {
	Endpoint  string `json:"endpoint" binding:"required"`
	P256DH    string `json:"p256dh" binding:"required"`
	Auth      string `json:"auth" binding:"required"`
	UserAgent string `json:"userAgent"`
}

// Subscribe saves or updates a browser push subscription.
func (h *PushSubscriptionHandlers) Subscribe(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var req SubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub := models.PushSubscription{
		ID:        uuid.New().String(),
		UserID:    userID,
		Endpoint:  req.Endpoint,
		P256DH:    req.P256DH,
		Auth:      req.Auth,
		UserAgent: req.UserAgent,
	}

	if err := h.notificationService.UpsertPushSubscription(c.Request.Context(), sub); err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("push subscribe error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save push subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// UnsubscribeRequest is the request body for removing a push subscription.
type UnsubscribeRequest struct {
	Endpoint string `json:"endpoint" binding:"required"`
}

// Unsubscribe removes a browser push subscription.
func (h *PushSubscriptionHandlers) Unsubscribe(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var req UnsubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.notificationService.DeletePushSubscription(c.Request.Context(), userID, req.Endpoint); err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("push unsubscribe error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove push subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// PublicKey returns the VAPID public key so the frontend can generate a push subscription.
func (h *PushSubscriptionHandlers) PublicKey(c *gin.Context) {
	publicKey := h.notificationService.GetVAPIDPublicKey()
	if publicKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "push notifications not configured"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"publicKey": publicKey})
}
