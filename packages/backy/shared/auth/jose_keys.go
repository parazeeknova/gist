package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
)

// GenerateRefreshToken creates a cryptographically random refresh token (raw value)
// and returns both the raw token and its SHA-256 hash (for storage).
func GenerateRefreshToken() (rawToken, tokenHash string, err error) {
	bytes := make([]byte, 64)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}

	rawToken = base64.RawURLEncoding.EncodeToString(bytes)
	hasher := sha256.Sum256([]byte(rawToken))
	tokenHash = base64.RawURLEncoding.EncodeToString(hasher[:])

	return rawToken, tokenHash, nil
}

// VerifyRefreshToken compares a raw refresh token against a stored hash.
func VerifyRefreshToken(rawToken, storedHash string) bool {
	hasher := sha256.Sum256([]byte(rawToken))
	computedHash := base64.RawURLEncoding.EncodeToString(hasher[:])
	return subtle.ConstantTimeCompare([]byte(computedHash), []byte(storedHash)) == 1
}

// GenerateSigningSecret creates a cryptographically random 32-byte secret
// suitable for HMAC signing. Returns the base64-encoded secret.
func GenerateSigningSecret() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate signing secret: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
