package services

import (
	"testing"
)

func TestGenerateBackupCodes(t *testing.T) {
	codes, hashes := generateBackupCodes(10)
	if len(codes) != 10 {
		t.Errorf("expected 10 codes, got %d", len(codes))
	}
	if len(hashes) != 10 {
		t.Errorf("expected 10 hashes, got %d", len(hashes))
	}

	// All codes should be unique
	seen := make(map[string]bool)
	for _, code := range codes {
		if seen[code] {
			t.Error("expected unique backup codes")
		}
		seen[code] = true
		if len(code) != 8 {
			t.Errorf("expected code length 8, got %d", len(code))
		}
	}

	// Verify hashes match codes
	for i := range codes {
		if !verifyBackupCode(codes[i], hashes[i]) {
			t.Errorf("hash mismatch for code %s", codes[i])
		}
	}
}

func TestHashBackupCode(t *testing.T) {
	code := "ABCD1234"
	hash := hashBackupCode(code)
	if hash == "" {
		t.Error("expected non-empty hash")
	}

	// Same code should produce same hash
	hash2 := hashBackupCode(code)
	if hash != hash2 {
		t.Error("expected consistent hashing")
	}

	// Different case should produce same hash
	hash3 := hashBackupCode("abcd1234")
	if hash != hash3 {
		t.Error("expected case-insensitive hashing")
	}
}

func TestVerifyBackupCode(t *testing.T) {
	code := "TEST1234"
	hash := hashBackupCode(code)

	// Valid code should verify
	if !verifyBackupCode(code, hash) {
		t.Error("expected valid code to verify")
	}

	// Invalid code should not verify
	if verifyBackupCode("WRONG567", hash) {
		t.Error("expected invalid code to fail verification")
	}
}

func TestMFAError(t *testing.T) {
	err := ErrMFAAlreadyEnabled
	if err.Error() != "mfa already enabled" {
		t.Errorf("error message = %s, want mfa already enabled", err.Error())
	}

	err2 := ErrMFANotEnabled
	if err2.Error() != "mfa not enabled" {
		t.Errorf("error message = %s, want mfa not enabled", err2.Error())
	}
}
