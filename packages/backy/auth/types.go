package auth

import (
	"time"

	"github.com/google/uuid"
)

// LoginRequest is the payload for authenticating a user.
// When the system is not yet bootstrapped, email must be provided and
// the endpoint will create the first owner user instead of logging in.
type LoginRequest struct {
	UsernameOrEmail string `json:"usernameOrEmail" binding:"required"`
	Password        string `json:"password" binding:"required"`
	Email           string `json:"email"`
	Name            string `json:"name"`
	WorkspaceName   string `json:"workspaceName"`
	SpaceName       string `json:"spaceName"`
}

// BootstrapStateResponse is returned by GET /api/auth/bootstrap-state.
type BootstrapStateResponse struct {
	Bootstrapped bool `json:"bootstrapped"`
}

// UserResponse is the sanitized user object returned to clients.
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL string    `json:"avatar_url"`
	IsOwner   bool      `json:"is_owner"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

// LoginResponse is returned after a successful login or bootstrap.
type LoginResponse struct {
	User UserResponse `json:"user"`
}

// ErrorResponse is a standard error payload.
type ErrorResponse struct {
	Error string `json:"error"`
}

// MFAChallengeResponse is returned when MFA verification is required after login.
type MFAChallengeResponse struct {
	MFARequired bool `json:"mfa_required"`
}

// MFAVerifyRequest is the payload for verifying an MFA code.
type MFAVerifyRequest struct {
	Code string `json:"code" binding:"required"`
}

// MFAStatusResponse is the payload for MFA status.
type MFAStatusResponse struct {
	IsEnabled         bool   `json:"is_enabled"`
	Method            string `json:"method"`
	WorkspaceEnforced bool   `json:"workspace_enforced"`
}

// MFASetupResponse is the payload for MFA setup.
type MFASetupResponse struct {
	Secret    string `json:"secret"`
	QRURI     string `json:"qr_uri"`
	ManualKey string `json:"manual_key"`
}

// MFAEnableRequest is the payload for enabling MFA.
type MFAEnableRequest struct {
	Code string `json:"code" binding:"required"`
}

// MFABackupCodesResponse is the payload for backup codes.
type MFABackupCodesResponse struct {
	Codes []string `json:"codes"`
}

// MFADisableRequest is the payload for disabling MFA.
type MFADisableRequest struct {
	Password string `json:"password" binding:"required"`
}
