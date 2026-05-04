package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"verso/backy/auth"
	"verso/backy/logger"
	"verso/backy/middleware"
	"verso/backy/services"
)

// MFAHandlers holds HTTP handlers for MFA endpoints.
type MFAHandlers struct {
	mfaService *services.MFAService
}

// NewMFAHandlers creates a new MFAHandlers.
func NewMFAHandlers(mfaService *services.MFAService) *MFAHandlers {
	return &MFAHandlers{mfaService: mfaService}
}

// RegisterRoutes registers all MFA routes on the given router group.
func (h *MFAHandlers) RegisterRoutes(rg *gin.RouterGroup) {
	mfaGroup := rg.Group("/mfa")
	{
		mfaGroup.GET("/status", h.Status)
		mfaGroup.POST("/setup", h.Setup)
		mfaGroup.POST("/enable", h.Enable)
		mfaGroup.POST("/disable", h.Disable)
		mfaGroup.POST("/backup-codes", h.RegenerateBackupCodes)
	}
}

// Status returns the MFA status for the current user.
func (h *MFAHandlers) Status(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "not authenticated"})
		return
	}

	status, err := h.mfaService.Status(c.Request.Context(), userID)
	if err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("mfa status error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to get mfa status"})
		return
	}

	c.JSON(http.StatusOK, auth.MFAStatusResponse{
		IsEnabled:         status.IsEnabled,
		Method:            status.Method,
		WorkspaceEnforced: status.WorkspaceEnforced,
	})
}

// Setup generates a new TOTP secret for the current user.
func (h *MFAHandlers) Setup(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "not authenticated"})
		return
	}

	result, err := h.mfaService.Setup(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, services.ErrMFAAlreadyEnabled) {
			c.JSON(http.StatusConflict, auth.ErrorResponse{Error: "mfa already enabled"})
			return
		}
		logger.Log.Error().Err(err).Str("user_id", userID).Msg("mfa setup error")
		c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to setup mfa"})
		return
	}

	c.JSON(http.StatusOK, auth.MFASetupResponse{
		Secret:    result.Secret,
		QRURI:     result.QRURI,
		ManualKey: result.ManualKey,
	})
}

// Enable enables MFA for the current user after verifying the initial TOTP code.
func (h *MFAHandlers) Enable(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "not authenticated"})
		return
	}

	var req auth.MFAEnableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.mfaService.Enable(c.Request.Context(), userID, req.Code)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrMFAAlreadyEnabled):
			c.JSON(http.StatusConflict, auth.ErrorResponse{Error: "mfa already enabled"})
		case errors.Is(err, services.ErrMFASetupNotFound):
			c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "mfa setup not found"})
		case errors.Is(err, services.ErrMFAInvalidCode):
			c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "invalid code"})
		default:
			logger.Log.Error().Err(err).Str("user_id", userID).Msg("mfa enable error")
			c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to enable mfa"})
		}
		return
	}

	c.JSON(http.StatusOK, auth.MFABackupCodesResponse{Codes: result.Codes})
}

// Disable disables MFA for the current user.
func (h *MFAHandlers) Disable(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "not authenticated"})
		return
	}

	var req auth.MFADisableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: err.Error()})
		return
	}

	err := h.mfaService.Disable(c.Request.Context(), userID, req.Password)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrMFANotEnabled):
			c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "mfa not enabled"})
		case errors.Is(err, services.ErrMFAInvalidPassword):
			c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "invalid password"})
		default:
			logger.Log.Error().Err(err).Str("user_id", userID).Msg("mfa disable error")
			c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to disable mfa"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// RegenerateBackupCodes generates new backup codes for the current user.
func (h *MFAHandlers) RegenerateBackupCodes(c *gin.Context) {
	userID := middleware.GetCurrentUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, auth.ErrorResponse{Error: "not authenticated"})
		return
	}

	result, err := h.mfaService.RegenerateBackupCodes(c.Request.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrMFANotEnabled):
			c.JSON(http.StatusBadRequest, auth.ErrorResponse{Error: "mfa not enabled"})
		default:
			logger.Log.Error().Err(err).Str("user_id", userID).Msg("mfa backup codes error")
			c.JSON(http.StatusInternalServerError, auth.ErrorResponse{Error: "failed to regenerate backup codes"})
		}
		return
	}

	c.JSON(http.StatusOK, auth.MFABackupCodesResponse{Codes: result.Codes})
}
