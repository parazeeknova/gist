package systemsettings

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/middleware"
	"verso/backy/repositories"
	"verso/backy/shared/logger"
)

type SystemSettingsHandlers struct {
	repo *repositories.SystemSettingsRepo
}

func NewSystemSettingsHandlers() *SystemSettingsHandlers {
	return &SystemSettingsHandlers{repo: repositories.NewSystemSettingsRepo()}
}

func (h *SystemSettingsHandlers) GetSettings(c *gin.Context) {
	settings, err := h.repo.GetAll(c.Request.Context())
	if err != nil {
		logger.Log.Error().Err(err).Msg("get system settings error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get system settings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

func (h *SystemSettingsHandlers) UpdateSetting(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var req struct {
		Key   string `json:"key"`
		Value bool   `json:"value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key and value are required"})
		return
	}

	if err := h.repo.Set(c.Request.Context(), req.Key, req.Value, userID); err != nil {
		logger.Log.Error().Err(err).Str("key", req.Key).Msg("update system setting error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update system setting"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
