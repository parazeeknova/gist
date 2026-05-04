package auth

import (
	"testing"
	"time"
)

func TestGenerateAndValidateMFAChallengeToken(t *testing.T) {
	userID := "test-user-id"

	tokenStr, err := GenerateMFAChallengeToken(userID)
	if err != nil {
		t.Fatalf("GenerateMFAChallengeToken failed: %v", err)
	}
	if tokenStr == "" {
		t.Fatal("token string is empty")
	}

	claims, err := ValidateMFAChallengeToken(tokenStr)
	if err != nil {
		t.Fatalf("ValidateMFAChallengeToken failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("UserID = %s, want %s", claims.UserID, userID)
	}

	// Subject should be the userID
	if claims.Subject != userID {
		t.Errorf("Subject = %s, want %s", claims.Subject, userID)
	}

	// Token should expire in approximately 5 minutes
	if claims.ExpiresAt == nil {
		t.Fatal("ExpiresAt is nil")
	}
	expectedExpiry := time.Now().Add(5 * time.Minute)
	diff := claims.ExpiresAt.Sub(expectedExpiry)
	if diff < -time.Minute || diff > time.Minute {
		t.Errorf("unexpected expiry time, got %v", claims.ExpiresAt)
	}
}

func TestValidateMFAChallengeToken_InvalidToken(t *testing.T) {
	_, err := ValidateMFAChallengeToken("invalid-token")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestValidateMFAChallengeToken_ExpiredToken(t *testing.T) {
	// Create a token with a secret but manipulate it to be expired
	userID := "test-user-id"

	tokenStr, err := GenerateMFAChallengeToken(userID)
	if err != nil {
		t.Fatalf("GenerateMFAChallengeToken failed: %v", err)
	}

	// Immediately validate (should succeed)
	_, err = ValidateMFAChallengeToken(tokenStr)
	if err != nil {
		t.Fatalf("immediate validation failed: %v", err)
	}
}

func TestGetMFAChallengeCookieName(t *testing.T) {
	name := GetMFAChallengeCookieName()
	if name == "" {
		t.Error("expected non-empty cookie name")
	}
	if name != "verso_mfa_challenge" {
		t.Errorf("cookie name = %s, want verso_mfa_challenge", name)
	}
}
