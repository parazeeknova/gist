package services

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/verso/backy/auth"
	"github.com/verso/backy/repositories"
)

// TokenPair holds the access and refresh tokens returned after authentication.
type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo    *repositories.UserRepo
	sessionRepo *repositories.SessionRepo
}

// NewAuthService creates a new AuthService.
func NewAuthService() *AuthService {
	return &AuthService{
		userRepo:    repositories.NewUserRepo(),
		sessionRepo: repositories.NewSessionRepo(),
	}
}

// UserRepo returns the underlying user repository (for middleware use).
func (s *AuthService) UserRepo() *repositories.UserRepo {
	return s.userRepo
}

// IsBootstrapped checks whether any users exist in the system.
func (s *AuthService) IsBootstrapped(ctx context.Context) (bool, error) {
	count, err := s.userRepo.CountUsers(ctx)
	if err != nil {
		return false, fmt.Errorf("check bootstrap state: %w", err)
	}
	return count > 0, nil
}

// Login authenticates a user by username or email and password.
// When the system is not yet bootstrapped (no users exist) and email is provided,
// it creates the first owner user instead of performing a normal login.
func (s *AuthService) Login(ctx context.Context, usernameOrEmail, password, email string) (*auth.UserResponse, *TokenPair, error) {
	bootstrapped, err := s.IsBootstrapped(ctx)
	if err != nil {
		return nil, nil, err
	}

	if !bootstrapped && email != "" {
		return s.bootstrap(ctx, usernameOrEmail, email, password)
	}

	if !bootstrapped {
		return nil, nil, fmt.Errorf("system not bootstrapped")
	}

	dbUser, err := s.userRepo.FindUserByUsernameOrEmail(ctx, usernameOrEmail)
	if err != nil {
		return nil, nil, fmt.Errorf("lookup user: %w", err)
	}
	if dbUser == nil {
		return nil, nil, nil
	}

	if !dbUser.IsActive {
		return nil, nil, fmt.Errorf("user account is inactive")
	}

	passwordHash, err := s.userRepo.GetPasswordHash(ctx, dbUser.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("get password hash: %w", err)
	}

	if !auth.VerifyPassword(password, passwordHash) {
		return nil, nil, nil
	}

	uid, err := uuid.Parse(dbUser.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("parse user id: %w", err)
	}

	createdAt, _ := time.Parse(time.RFC3339, dbUser.CreatedAt)
	userResp := &auth.UserResponse{
		ID:        uid,
		Username:  dbUser.Username,
		Email:     dbUser.Email,
		IsOwner:   dbUser.IsOwner,
		IsActive:  dbUser.IsActive,
		CreatedAt: createdAt,
	}

	pair, err := s.createSession(ctx, dbUser.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("create session: %w", err)
	}

	return userResp, pair, nil
}

// bootstrap creates the first owner user when no users exist.
func (s *AuthService) bootstrap(ctx context.Context, username, email, password string) (*auth.UserResponse, *TokenPair, error) {
	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		return nil, nil, fmt.Errorf("hash password: %w", err)
	}

	userID, err := s.userRepo.CreateUser(ctx, username, email, passwordHash, true)
	if err != nil {
		return nil, nil, fmt.Errorf("create bootstrap user: %w", err)
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("parse user id: %w", err)
	}

	userResp := &auth.UserResponse{
		ID:        uid,
		Username:  username,
		Email:     email,
		IsOwner:   true,
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	pair, err := s.createSession(ctx, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("create session: %w", err)
	}

	return userResp, pair, nil
}

// Refresh rotates a refresh token and returns new token pairs.
func (s *AuthService) Refresh(ctx context.Context, rawRefreshToken string) (*TokenPair, error) {
	if rawRefreshToken == "" {
		return nil, fmt.Errorf("missing refresh token")
	}

	tokenHash := sha256Hash(rawRefreshToken)
	session, err := s.sessionRepo.GetSessionByRefreshToken(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("lookup session: %w", err)
	}
	if session == nil {
		// Check if this is a replay of a previously rotated or revoked token
		replayed, replayedSessionID := s.sessionRepo.IsReplayedToken(ctx, tokenHash)
		if replayed && replayedSessionID != "" {
			_ = s.sessionRepo.RevokeAllSessionTokens(ctx, replayedSessionID)
		}
		return nil, fmt.Errorf("invalid or expired refresh token")
	}

	newRawToken, newTokenHash, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate new refresh token: %w", err)
	}

	refreshTTL := auth.GetRefreshTokenTTL()
	newExpiresAt := time.Now().Add(refreshTTL)

	newSessionID, err := s.sessionRepo.RotateRefreshToken(ctx, tokenHash, newTokenHash, newExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("rotate refresh token: %w", err)
	}

	_ = s.sessionRepo.UpdateSessionLastSeen(ctx, newSessionID)

	dbUser, err := s.userRepo.GetUserByID(ctx, session.UserID)
	if err != nil || dbUser == nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	uid, err := uuid.Parse(dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	accessToken, err := auth.GenerateAccessToken(uid, dbUser.Username, newSessionID)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRawToken,
	}, nil
}

// Logout revokes a refresh token, effectively ending the session.
func (s *AuthService) Logout(ctx context.Context, rawRefreshToken string) error {
	if rawRefreshToken == "" {
		return nil
	}

	tokenHash := sha256Hash(rawRefreshToken)
	return s.sessionRepo.RevokeRefreshToken(ctx, tokenHash)
}

// ValidateSession checks whether a session is still active (not expired, not revoked).
func (s *AuthService) ValidateSession(ctx context.Context, sessionID string) (bool, error) {
	return s.sessionRepo.IsSessionActive(ctx, sessionID)
}

// GetMe retrieves the current user by ID.
func (s *AuthService) GetMe(ctx context.Context, userID string) (*auth.UserResponse, error) {
	dbUser, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if dbUser == nil {
		return nil, fmt.Errorf("user not found")
	}

	uid, err := uuid.Parse(dbUser.ID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	createdAt, _ := time.Parse(time.RFC3339, dbUser.CreatedAt)
	return &auth.UserResponse{
		ID:        uid,
		Username:  dbUser.Username,
		Email:     dbUser.Email,
		IsOwner:   dbUser.IsOwner,
		IsActive:  dbUser.IsActive,
		CreatedAt: createdAt,
	}, nil
}

func (s *AuthService) createSession(ctx context.Context, userID string) (*TokenPair, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	dbUser, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil || dbUser == nil {
		return nil, fmt.Errorf("get user for access token: %w", err)
	}

	refreshTTL := auth.GetRefreshTokenTTL()
	sessionExpiresAt := time.Now().Add(refreshTTL)
	sessionID, err := s.sessionRepo.CreateSession(ctx, userID, sessionExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("create session record: %w", err)
	}

	accessToken, err := auth.GenerateAccessToken(uid, dbUser.Username, sessionID)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	rawRefreshToken, refreshTokenHash, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	_, err = s.sessionRepo.StoreRefreshToken(ctx, sessionID, refreshTokenHash, sessionExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: rawRefreshToken,
	}, nil
}

func sha256Hash(input string) string {
	hash := sha256.Sum256([]byte(input))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}
