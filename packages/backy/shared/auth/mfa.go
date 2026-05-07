package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// MFAChallengeClaims holds the custom claims for an MFA challenge JWT.
type MFAChallengeClaims struct {
	jwt.RegisteredClaims
	UserID string `json:"uid"`
}

// GenerateMFAChallengeToken creates a short-lived JWT used during MFA verification.
func GenerateMFAChallengeToken(userID string) (string, error) {
	secret := getAccessTokenSecret()
	issuer := getJWTIssuer()
	audience := getJWTAudience()

	now := time.Now()
	claims := MFAChallengeClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			Subject:   userID,
			Audience:  jwt.ClaimStrings{audience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(5 * time.Minute)),
			NotBefore: jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
		UserID: userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateMFAChallengeToken parses and validates an MFA challenge JWT.
func ValidateMFAChallengeToken(tokenString string) (*MFAChallengeClaims, error) {
	secret := getAccessTokenSecret()
	issuer := getJWTIssuer()
	audience := getJWTAudience()

	token, err := jwt.ParseWithClaims(
		tokenString,
		&MFAChallengeClaims{},
		func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(issuer),
		jwt.WithAudience(audience),
		jwt.WithExpirationRequired(),
		jwt.WithLeeway(30*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("parse mfa challenge token: %w", err)
	}

	claims, ok := token.Claims.(*MFAChallengeClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid mfa challenge token claims")
	}

	return claims, nil
}

// GetMFAChallengeCookieName returns the cookie name for the MFA challenge token.
func GetMFAChallengeCookieName() string {
	if name := os.Getenv("MFA_CHALLENGE_COOKIE_NAME"); name != "" {
		return name
	}
	return "verso_mfa_challenge"
}
