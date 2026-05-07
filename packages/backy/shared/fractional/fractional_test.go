package fractional

import (
	"testing"
)

func TestNextPosition_FirstKey(t *testing.T) {
	pos := NextPosition(nil)
	if pos != "a0" {
		t.Fatalf("expected a0, got %q", pos)
	}
}

func TestNextPosition_SecondKey(t *testing.T) {
	first := "a0"
	pos := NextPosition(&first)
	if pos <= first {
		t.Fatalf("expected key after %q, got %q", first, pos)
	}
}

func TestNextPosition_KeyIncrements(t *testing.T) {
	keys := make([]string, 0, 5)
	var last *string
	for i := 0; i < 5; i++ {
		k := NextPosition(last)
		if last != nil && k <= *last {
			t.Fatalf("key %q is not after %q (iteration %d)", k, *last, i)
		}
		keys = append(keys, k)
		last = &k
	}

	// Verify ascending order.
	for i := 1; i < len(keys); i++ {
		if keys[i] <= keys[i-1] {
			t.Fatalf("keys not sorted: %q <= %q", keys[i], keys[i-1])
		}
	}
}

func TestGenerateKeyBetween_FirstAndSecond(t *testing.T) {
	a := "a0"
	b := "a5"
	mid := GenerateKeyBetween(&a, &b)
	if mid <= a || mid >= b {
		t.Fatalf("expected key between %q and %q, got %q", a, b, mid)
	}
}

func TestGenerateKeyBetween_SamePrefix(t *testing.T) {
	a := "a1"
	b := "a2"
	mid := GenerateKeyBetween(&a, &b)
	if mid <= a || mid >= b {
		t.Fatalf("expected key between %q and %q, got %q", a, b, mid)
	}
}

func TestGenerateKeyBetween_BothNil(t *testing.T) {
	pos := GenerateKeyBetween(nil, nil)
	if pos != "a0" {
		t.Fatalf("expected a0, got %q", pos)
	}
}

func TestGenerateKeyBetween_OnlyLower(t *testing.T) {
	b := "b0"
	pos := GenerateKeyBetween(nil, &b)
	if pos >= b {
		t.Fatalf("expected key before %q, got %q", b, pos)
	}
}

func TestGenerateKeyBetween_OnlyUpper(t *testing.T) {
	a := "z9"
	pos := GenerateKeyBetween(&a, nil)
	if pos <= a {
		t.Fatalf("expected key after %q, got %q", a, pos)
	}
}

func TestValidate_ValidKeys(t *testing.T) {
	keys := []string{"a0", "abc123", "z999", "foo99"}
	for _, k := range keys {
		if err := Validate(k); err != nil {
			t.Fatalf("expected valid key %q, got error: %v", k, err)
		}
	}
}

func TestValidate_InvalidKeys(t *testing.T) {
	keys := []string{"", "A0", "a-b", "a_b", "a.0"}
	for _, k := range keys {
		if err := Validate(k); err == nil {
			t.Fatalf("expected error for invalid key %q", k)
		}
	}
}

func TestKeyAfter(t *testing.T) {
	tests := []struct {
		input  string
		wantGt string // result must be > wantGt
	}{
		{"a0", "a0"},
		{"a1", "a1"},
		{"z9", "z9"},
		{"0", "0"},
	}
	for _, tc := range tests {
		result := keyAfter(tc.input)
		if result <= tc.wantGt {
			t.Fatalf("keyAfter(%q) = %q, want > %q", tc.input, result, tc.wantGt)
		}
	}
}

func TestKeyBefore(t *testing.T) {
	tests := []struct {
		input  string
		wantLt string // result must be < wantLt
	}{
		{"a5", "a5"},
		{"a1", "a1"},
		{"b0", "b0"},
	}
	for _, tc := range tests {
		result := keyBefore(tc.input)
		if result >= tc.wantLt {
			t.Fatalf("keyBefore(%q) = %q, want < %q", tc.input, result, tc.wantLt)
		}
	}
}

func TestNextTenKeys(t *testing.T) {
	// Generate 10 keys in sequence and verify they're all sorted.
	var last *string
	for i := 0; i < 10; i++ {
		k := NextPosition(last)
		if last != nil && k <= *last {
			t.Fatalf("iteration %d: %q <= %q", i, k, *last)
		}
		last = &k
	}
}

func TestInsertBetween(t *testing.T) {
	// Simulate inserting a key between two existing ones.
	a := "a0"
	z := "a5"
	mid := GenerateKeyBetween(&a, &z)
	if mid <= a || mid >= z {
		t.Fatalf("expected key between %q and %q, got %q", a, z, mid)
	}
}
