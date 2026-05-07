package mfa_test

import (
	"strings"
	"testing"
)

func TestGenerateBackupCodes(t *testing.T) {
	codes, hashes, err := generateBackupCodes(10)
	if err != nil {
		t.Fatalf("generateBackupCodes failed: %v", err)
	}
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
		if len(code) != 14 {
			t.Errorf("expected code length 14, got %d", len(code))
		}
		// Should contain two hyphens
		if strings.Count(code, "-") != 2 {
			t.Errorf("expected code with 2 hyphens, got %s", code)
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
	code := "ABCD-EFGH-IJKL"
	hash, err := hashBackupCode(code)
	if err != nil {
		t.Fatalf("hashBackupCode failed: %v", err)
	}
	if hash == "" {
		t.Error("expected non-empty hash")
	}
	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Errorf("expected argon2id hash, got %s", hash)
	}

	// Different case should produce valid hash that verifies
	hash2, err := hashBackupCode("abcd-efgh-ijkl")
	if err != nil {
		t.Fatalf("hashBackupCode failed: %v", err)
	}
	if !verifyBackupCode("ABCD-EFGH-IJKL", hash2) {
		t.Error("expected case-insensitive verification")
	}
}

func TestVerifyBackupCode(t *testing.T) {
	code := "TEST-1234-5678"
	hash, err := hashBackupCode(code)
	if err != nil {
		t.Fatalf("hashBackupCode failed: %v", err)
	}

	// Valid code should verify
	if !verifyBackupCode(code, hash) {
		t.Error("expected valid code to verify")
	}

	// Invalid code should not verify
	if verifyBackupCode("WRONG-5678-9012", hash) {
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
