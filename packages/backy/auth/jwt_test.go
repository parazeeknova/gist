package auth

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func init() {
	os.Setenv("JWT_ACCESS_TOKEN_SECRET", "test-secret-that-is-at-least-32-bytes-long!")
	os.Setenv("JWT_ISSUER", "verso-test")
	os.Setenv("JWT_AUDIENCE", "verso-test")
	os.Setenv("ACCESS_TOKEN_TTL", "15m")
}

func TestGenerateAndValidateAccessToken(t *testing.T) {
	userID := uuid.New()
	username := "testuser"
	sessionID := uuid.New().String()

	tokenStr, err := GenerateAccessToken(userID, username, sessionID)
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}
	if tokenStr == "" {
		t.Fatal("token string is empty")
	}

	claims, err := ValidateAccessToken(tokenStr)
	if err != nil {
		t.Fatalf("ValidateAccessToken failed: %v", err)
	}

	if claims.UserID != userID.String() {
		t.Errorf("UserID = %s, want %s", claims.UserID, userID.String())
	}
	if claims.Username != username {
		t.Errorf("Username = %s, want %s", claims.Username, username)
	}
	if claims.SessionID != sessionID {
		t.Errorf("SessionID = %s, want %s", claims.SessionID, sessionID)
	}
	if claims.Issuer != "verso-test" {
		t.Errorf("Issuer = %s, want verso-test", claims.Issuer)
	}
}

func TestValidateAccessToken_WrongIssuer(t *testing.T) {
	userID := uuid.New()
	sessionID := uuid.New().String()

	// Create token with wrong issuer
	secret := getAccessTokenSecret()
	ttl := getAccessTokenTTL()
	now := time.Now()

	claims := AccessTokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "wrong-issuer",
			Subject:   userID.String(),
			Audience:  jwt.ClaimStrings{"verso-test"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			NotBefore: jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
		UserID:    userID.String(),
		Username:  "testuser",
		SessionID: sessionID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	_, err = ValidateAccessToken(tokenStr)
	if err == nil {
		t.Error("expected validation error for wrong issuer, got nil")
	}
}

func TestValidateAccessToken_WrongAudience(t *testing.T) {
	userID := uuid.New()
	sessionID := uuid.New().String()

	secret := getAccessTokenSecret()
	ttl := getAccessTokenTTL()
	now := time.Now()

	claims := AccessTokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "verso-test",
			Subject:   userID.String(),
			Audience:  jwt.ClaimStrings{"wrong-audience"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			NotBefore: jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
		UserID:    userID.String(),
		Username:  "testuser",
		SessionID: sessionID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	_, err = ValidateAccessToken(tokenStr)
	if err == nil {
		t.Error("expected validation error for wrong audience, got nil")
	}
}

func TestValidateAccessToken_InvalidSignature(t *testing.T) {
	userID := uuid.New()
	sessionID := uuid.New().String()

	orgSecret := os.Getenv("JWT_ACCESS_TOKEN_SECRET")
	defer os.Setenv("JWT_ACCESS_TOKEN_SECRET", orgSecret)
	os.Setenv("JWT_ACCESS_TOKEN_SECRET", "different-secret-that-is-at-least-32-bytes!!")

	tokenStr, err := GenerateAccessToken(userID, "testuser", sessionID)
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}

	os.Setenv("JWT_ACCESS_TOKEN_SECRET", orgSecret)

	_, err = ValidateAccessToken(tokenStr)
	if err == nil {
		t.Error("expected validation error for invalid signature, got nil")
	}
}

func TestValidateAccessToken_NonHMAC(t *testing.T) {
	// Try to validate an unsigned token (algorithm "none")
	userID := uuid.New()
	sessionID := uuid.New().String()
	now := time.Now()

	claims := AccessTokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "verso-test",
			Subject:   userID.String(),
			Audience:  jwt.ClaimStrings{"verso-test"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
			NotBefore: jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
		UserID:    userID.String(),
		Username:  "testuser",
		SessionID: sessionID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	tokenStr := token.Raw

	_, err := ValidateAccessToken(tokenStr)
	if err == nil {
		t.Error("expected validation error for 'none' algorithm, got nil")
	}
}

func TestValidateSecret_WeakDefault(t *testing.T) {
	orgSecret := os.Getenv("JWT_ACCESS_TOKEN_SECRET")
	defer os.Setenv("JWT_ACCESS_TOKEN_SECRET", orgSecret)

	os.Setenv("JWT_ACCESS_TOKEN_SECRET", "change-me-to-a-random-secret")
	err := ValidateSecret()
	if err == nil {
		t.Error("expected error for default secret value")
	}
}

func TestValidateSecret_TooShort(t *testing.T) {
	orgSecret := os.Getenv("JWT_ACCESS_TOKEN_SECRET")
	defer os.Setenv("JWT_ACCESS_TOKEN_SECRET", orgSecret)

	os.Setenv("JWT_ACCESS_TOKEN_SECRET", "short")
	err := ValidateSecret()
	if err == nil {
		t.Error("expected error for too-short secret")
	}
}

func TestValidateSecret_NonRandom(t *testing.T) {
	orgSecret := os.Getenv("JWT_ACCESS_TOKEN_SECRET")
	defer os.Setenv("JWT_ACCESS_TOKEN_SECRET", orgSecret)

	os.Setenv("JWT_ACCESS_TOKEN_SECRET", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	err := ValidateSecret()
	if err == nil {
		t.Error("expected error for non-random (repeated char) secret")
	}
}

func TestValidateSecret_Valid(t *testing.T) {
	orgSecret := os.Getenv("JWT_ACCESS_TOKEN_SECRET")
	defer os.Setenv("JWT_ACCESS_TOKEN_SECRET", orgSecret)

	generated, err := GenerateSecret()
	if err != nil {
		t.Fatalf("GenerateSecret failed: %v", err)
	}
	os.Setenv("JWT_ACCESS_TOKEN_SECRET", generated)
	err = ValidateSecret()
	if err != nil {
		t.Errorf("expected no error for generated secret, got: %v", err)
	}
}

func TestGetCookieSecure_DefaultLocalhost(t *testing.T) {
	orgDomain := os.Getenv("COOKIE_DOMAIN")
	orgSecure := os.Getenv("COOKIE_SECURE")
	defer func() {
		os.Setenv("COOKIE_DOMAIN", orgDomain)
		os.Setenv("COOKIE_SECURE", orgSecure)
	}()

	os.Setenv("COOKIE_DOMAIN", "localhost")
	os.Unsetenv("COOKIE_SECURE")

	if GetCookieSecure() {
		t.Error("expected COOKIE_SECURE=false for localhost domain when not explicitly set")
	}
}

func TestGetCookieSecure_DefaultProduction(t *testing.T) {
	orgDomain := os.Getenv("COOKIE_DOMAIN")
	orgSecure := os.Getenv("COOKIE_SECURE")
	defer func() {
		os.Setenv("COOKIE_DOMAIN", orgDomain)
		os.Setenv("COOKIE_SECURE", orgSecure)
	}()

	os.Setenv("COOKIE_DOMAIN", "example.com")
	os.Unsetenv("COOKIE_SECURE")

	if !GetCookieSecure() {
		t.Error("expected COOKIE_SECURE=true for non-localhost domain when not explicitly set")
	}
}

func TestGetCookieSecure_ExplicitOverride(t *testing.T) {
	orgSecure := os.Getenv("COOKIE_SECURE")
	defer os.Setenv("COOKIE_SECURE", orgSecure)

	os.Setenv("COOKIE_SECURE", "false")
	if GetCookieSecure() {
		t.Error("expected false when explicitly set to false")
	}

	os.Setenv("COOKIE_SECURE", "true")
	if !GetCookieSecure() {
		t.Error("expected true when explicitly set to true")
	}
}
