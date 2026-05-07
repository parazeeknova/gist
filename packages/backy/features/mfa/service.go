package mfa

import (
	"context"
	"crypto/rand"
	"fmt"
	"strings"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"

	"verso/backy/repositories"
	"verso/backy/shared/auth"
	"verso/backy/shared/logger"
)

// MFAError is returned for MFA-specific errors.
type MFAError string

func (e MFAError) Error() string { return string(e) }

const (
	ErrMFAAlreadyEnabled  = MFAError("mfa already enabled")
	ErrMFANotEnabled      = MFAError("mfa not enabled")
	ErrMFAInvalidCode     = MFAError("invalid mfa code")
	ErrMFASetupNotFound   = MFAError("mfa setup not found")
	ErrMFAInvalidPassword = MFAError("invalid password")
)

// MFAService handles MFA business logic.
type MFAService struct {
	mfaRepo       *repositories.MFARepo
	userRepo      *repositories.UserRepo
	workspaceRepo *repositories.WorkspaceRepo
	authService   *AuthService
}

// NewMFAService creates a new MFAService.
func NewMFAService(authService *AuthService) *MFAService {
	return &MFAService{
		mfaRepo:       repositories.NewMFARepo(),
		userRepo:      repositories.NewUserRepo(),
		workspaceRepo: repositories.NewWorkspaceRepo(),
		authService:   authService,
	}
}

// Status returns the MFA status for a user.
func (s *MFAService) Status(ctx context.Context, userID string) (*MFAStatus, error) {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get mfa status: %w", err)
	}

	// Check if any workspace enforces MFA
	workspaces, err := s.workspaceRepo.ListAll(ctx)
	if err != nil {
		logger.Log.Error().Err(err).Msg("list workspaces for mfa status")
	}

	workspaceEnforced := false
	for _, w := range workspaces {
		if w.EnforceMFA {
			workspaceEnforced = true
			break
		}
	}

	status := &MFAStatus{
		IsEnabled:         mfa != nil && mfa.IsEnabled,
		Method:            "totp",
		WorkspaceEnforced: workspaceEnforced,
	}

	if mfa != nil {
		status.Method = mfa.Method
	}

	return status, nil
}

// MFAStatus holds the MFA status response.
type MFAStatus struct {
	IsEnabled         bool   `json:"is_enabled"`
	Method            string `json:"method"`
	WorkspaceEnforced bool   `json:"workspace_enforced"`
}

// Setup generates a new TOTP secret for a user.
func (s *MFAService) Setup(ctx context.Context, userID string) (*MFASetupResult, error) {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get mfa for setup: %w", err)
	}
	if mfa != nil && mfa.IsEnabled {
		return nil, ErrMFAAlreadyEnabled
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Verso",
		AccountName: userID,
		SecretSize:  32,
		Digits:      otp.DigitsSix,
		Algorithm:   otp.AlgorithmSHA1,
	})
	if err != nil {
		return nil, fmt.Errorf("generate totp key: %w", err)
	}

	// Store the secret (not yet enabled)
	if mfa == nil {
		err = s.mfaRepo.Upsert(ctx, userID, "", "totp", key.Secret(), false, []string{})
	} else {
		err = s.mfaRepo.UpdateSecret(ctx, userID, key.Secret())
	}
	if err != nil {
		return nil, fmt.Errorf("store mfa secret: %w", err)
	}

	user, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user for setup: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	return &MFASetupResult{
		Secret:    key.Secret(),
		QRURI:     key.URL(),
		ManualKey: key.Secret(),
	}, nil
}

// MFASetupResult holds the TOTP setup data.
type MFASetupResult struct {
	Secret    string `json:"secret"`
	QRURI     string `json:"qr_uri"`
	ManualKey string `json:"manual_key"`
}

// Enable enables MFA for a user after verifying the initial TOTP code.
func (s *MFAService) Enable(ctx context.Context, userID, code string) (*MFABackupCodesResult, error) {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get mfa for enable: %w", err)
	}
	if mfa == nil || mfa.Secret == "" {
		return nil, ErrMFASetupNotFound
	}
	if mfa.IsEnabled {
		return nil, ErrMFAAlreadyEnabled
	}

	valid := totp.Validate(code, mfa.Secret)
	if !valid {
		return nil, ErrMFAInvalidCode
	}

	codes, hashes, genErr := generateBackupCodes(10)
	if genErr != nil {
		return nil, fmt.Errorf("generate backup codes: %w", genErr)
	}
	err = s.mfaRepo.Enable(ctx, userID, hashes)
	if err != nil {
		return nil, fmt.Errorf("enable mfa: %w", err)
	}

	return &MFABackupCodesResult{Codes: codes}, nil
}

// MFABackupCodesResult holds the plaintext backup codes.
type MFABackupCodesResult struct {
	Codes []string `json:"codes"`
}

// Disable disables MFA for a user after verifying their password.
func (s *MFAService) Disable(ctx context.Context, userID, password string) error {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get mfa for disable: %w", err)
	}
	if mfa == nil || !mfa.IsEnabled {
		return ErrMFANotEnabled
	}

	passwordHash, err := s.userRepo.GetPasswordHash(ctx, userID)
	if err != nil {
		return fmt.Errorf("get password hash: %w", err)
	}
	if passwordHash == "" {
		return ErrMFAInvalidPassword
	}

	if !auth.VerifyPassword(password, passwordHash) {
		return ErrMFAInvalidPassword
	}

	return s.mfaRepo.Disable(ctx, userID)
}

// RegenerateBackupCodes generates new backup codes for a user.
func (s *MFAService) RegenerateBackupCodes(ctx context.Context, userID string) (*MFABackupCodesResult, error) {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get mfa for backup codes: %w", err)
	}
	if mfa == nil || !mfa.IsEnabled {
		return nil, ErrMFANotEnabled
	}

	codes, hashes, genErr := generateBackupCodes(10)
	if genErr != nil {
		return nil, fmt.Errorf("generate backup codes: %w", genErr)
	}
	err = s.mfaRepo.UpdateBackupCodes(ctx, userID, hashes)
	if err != nil {
		return nil, fmt.Errorf("update backup codes: %w", err)
	}

	return &MFABackupCodesResult{Codes: codes}, nil
}

// Verify checks a TOTP code or backup code for a user.
// Returns true if valid, and whether a backup code was used.
func (s *MFAService) Verify(ctx context.Context, userID, code string) (bool, bool, error) {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return false, false, fmt.Errorf("get mfa for verify: %w", err)
	}
	if mfa == nil || !mfa.IsEnabled {
		return false, false, ErrMFANotEnabled
	}

	// Try TOTP first
	if totp.Validate(code, mfa.Secret) {
		return true, false, nil
	}

	// Try backup codes
	for i, hash := range mfa.BackupCodeHashes {
		if hash == "" {
			continue
		}
		if verifyBackupCode(code, hash) {
			// Remove the used backup code
			newHashes := append(mfa.BackupCodeHashes[:i], mfa.BackupCodeHashes[i+1:]...)
			if updateErr := s.mfaRepo.UpdateBackupCodes(ctx, userID, newHashes); updateErr != nil {
				logger.Log.Error().Err(updateErr).Str("user_id", userID).Msg("failed to remove used backup code")
				return false, false, fmt.Errorf("consume backup code: %w", updateErr)
			}
			return true, true, nil
		}
	}

	return false, false, nil
}

// IsMFARequired checks if MFA is required for a user (either user-enabled or workspace-enforced).
func (s *MFAService) IsMFARequired(ctx context.Context, userID string) (bool, error) {
	mfa, err := s.mfaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return false, fmt.Errorf("get mfa for required check: %w", err)
	}
	if mfa != nil && mfa.IsEnabled {
		return true, nil
	}

	// Check workspace enforcement
	workspaces, err := s.workspaceRepo.ListAll(ctx)
	if err != nil {
		return false, fmt.Errorf("list workspaces: %w", err)
	}
	for _, w := range workspaces {
		if w.EnforceMFA {
			return true, nil
		}
	}

	return false, nil
}

// generateBackupCodes generates n random backup codes and their argon2id hashes.
func generateBackupCodes(n int) ([]string, []string, error) {
	codes := make([]string, n)
	hashes := make([]string, n)
	for i := range n {
		code, err := randomBackupCode()
		if err != nil {
			return nil, nil, fmt.Errorf("generate backup code: %w", err)
		}
		codes[i] = code
		hash, err := hashBackupCode(code)
		if err != nil {
			return nil, nil, fmt.Errorf("hash backup code: %w", err)
		}
		hashes[i] = hash
	}
	return codes, hashes, nil
}

// randomBackupCode generates a random 12-character alphanumeric backup code
// formatted in groups of 4 with hyphens (e.g., ABCD-EFGH-IJKL).
func randomBackupCode() (string, error) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const groups = 3
	const groupSize = 4
	b := make([]byte, groups*groupSize)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("secure random generation failed: %w", err)
	}
	for i := range b {
		b[i] = chars[int(b[i])%len(chars)]
	}
	var sb strings.Builder
	for g := 0; g < groups; g++ {
		if g > 0 {
			sb.WriteByte('-')
		}
		sb.Write(b[g*groupSize : (g+1)*groupSize])
	}
	return sb.String(), nil
}

// hashBackupCode hashes a backup code using argon2id.
func hashBackupCode(code string) (string, error) {
	return auth.HashPassword(strings.ToUpper(code))
}

// verifyBackupCode verifies a backup code against an argon2id hash.
func verifyBackupCode(code, hash string) bool {
	return auth.VerifyPassword(strings.ToUpper(code), hash)
}
