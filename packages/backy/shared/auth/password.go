package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argon2Time    = 3
	argon2Memory  = 64 * 1024
	argon2Threads = 4
	argon2KeyLen  = 32
	argon2SaltLen = 16

	argon2Prefix = "$argon2id$v=19$"
)

// HashPassword hashes a plaintext password using argon2id.
// Returns an encoded hash string suitable for storage.
func HashPassword(password string) (string, error) {
	salt := make([]byte, argon2SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate salt: %w", err)
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argon2Time,
		argon2Memory,
		argon2Threads,
		argon2KeyLen,
	)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	encoded := fmt.Sprintf(
		"%sm=%d,t=%d,p=%d$%s$%s",
		argon2Prefix,
		argon2Memory,
		argon2Time,
		argon2Threads,
		b64Salt,
		b64Hash,
	)

	return encoded, nil
}

// VerifyPassword compares a plaintext password against an argon2id hash.
func VerifyPassword(password, encodedHash string) bool {
	salt, expectedHash, err := decodeArgon2Hash(encodedHash)
	if err != nil {
		return false
	}

	computedHash := argon2.IDKey(
		[]byte(password),
		salt,
		argon2Time,
		argon2Memory,
		argon2Threads,
		argon2KeyLen,
	)

	return subtle.ConstantTimeCompare(computedHash, expectedHash) == 1
}

func decodeArgon2Hash(encoded string) (salt, hash []byte, err error) {
	parts := strings.Split(encoded, "$")
	// Expected format: $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
	if len(parts) != 6 {
		return nil, nil, fmt.Errorf("invalid argon2 hash format: expected 6 parts, got %d", len(parts))
	}

	b64Salt := parts[4]
	b64Hash := parts[5]

	salt, err = base64.RawStdEncoding.DecodeString(b64Salt)
	if err != nil {
		return nil, nil, fmt.Errorf("decode salt: %w", err)
	}

	hash, err = base64.RawStdEncoding.DecodeString(b64Hash)
	if err != nil {
		return nil, nil, fmt.Errorf("decode hash: %w", err)
	}

	return salt, hash, nil
}
