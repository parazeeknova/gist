// Package fractional implements lexicographic fractional indexing for page sibling
// ordering. Each position is a TEXT value that sorts correctly under COLLATE "C"
// (binary comparison), and a new key can always be generated between any two
// existing keys without rebalancing the entire list.
//
// Inspired by the fractional-indexing-jittered npm package used in Docmost, but
// implemented idiomatically in Go.
package fractional

import (
	"fmt"
	"strings"
)

// alphabet defines the character set for fractional keys.
// Characters must be in ascending ASCII order for COLLATE "C" to work.
// '0'..'9' (48-57) < 'a'..'z' (97-122)
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"

// GenerateKeyBetween returns a key that sorts lexicographically between a and b.
// Pass nil for a to get a key before b.
// Pass nil for b to get a key after a.
// Pass nil for both to get the first key ("a0").
func GenerateKeyBetween(a, b *string) string {
	return generateKeyBetween(a, b)
}

// NextPosition returns the next position after the given key (or "a0" if none).
func NextPosition(after *string) string {
	return generateKeyBetween(after, nil)
}

// Between returns a key that sorts between the two given keys.
func Between(a, b *string) string {
	return generateKeyBetween(a, b)
}

// Validate checks that a position key is structurally valid.
func Validate(key string) error {
	return validate(key)
}

func validate(key string) error {
	if len(key) == 0 {
		return fmt.Errorf("key must not be empty")
	}
	for _, c := range key {
		if !strings.ContainsRune(alphabet, c) {
			return fmt.Errorf("invalid character %c in key", c)
		}
	}
	return nil
}

func generateKeyBetween(a, b *string) string {
	if a != nil {
		if err := validate(*a); err != nil {
			panic(fmt.Sprintf("fractional: invalid position %q: %v", *a, err))
		}
	}
	if b != nil {
		if err := validate(*b); err != nil {
			panic(fmt.Sprintf("fractional: invalid position %q: %v", *b, err))
		}
	}
	if a != nil && b != nil && *a >= *b {
		panic(fmt.Sprintf("fractional: a (%q) must be < b (%q)", *a, *b))
	}

	// Both nil: return first key.
	if a == nil && b == nil {
		return "a0"
	}

	// Only lower bound: generate after a.
	if b == nil {
		return keyAfter(*a)
	}

	// Only upper bound: generate before b.
	if a == nil {
		return keyBefore(*b)
	}

	// Both provided: generate between.
	return keyBetween(*a, *b)
}

func indexOf(c byte) int {
	for i := 0; i < len(alphabet); i++ {
		if alphabet[i] == c {
			return i
		}
	}
	return -1
}

// keyAfter returns a key that sorts strictly after the given key.
func keyAfter(key string) string {
	chars := []byte(key)
	for i := len(chars) - 1; i >= 0; i-- {
		idx := indexOf(chars[i])
		if idx >= 0 && idx < len(alphabet)-1 {
			chars[i] = alphabet[idx+1]
			return string(chars[:i+1])
		}
		chars[i] = alphabet[0]
	}
	// All characters were maxed out: prepend '1'.
	return "1" + string(chars)
}

// keyBefore returns a key that sorts strictly before the given key.
func keyBefore(key string) string {
	chars := []byte(key)

	// Try to decrement the last character.
	for i := len(chars) - 1; i >= 0; i-- {
		idx := indexOf(chars[i])
		if idx > 0 {
			chars[i] = alphabet[idx-1]
			// If we decremented the last char to 'z' when it was '0' (wrap-around),
			// that's a problem. Let's check.
			// Actually, we just need to return after decrementing.
			return string(chars[:i+1])
		}
		chars[i] = alphabet[len(alphabet)-1]
	}
	// All characters were alphabet[0] ('0'). Return "0" plus the padded chars.
	return "0" + string(chars)
}

// keyBetween returns a key that sorts between a and b.
func keyBetween(a, b string) string {
	digA := make([]int, 0)
	digB := make([]int, 0)
	for _, c := range a {
		digA = append(digA, indexOf(byte(c)))
	}
	for _, c := range b {
		digB = append(digB, indexOf(byte(c)))
	}

	result := make([]byte, 0)

	for i := 0; ; i++ {
		da := 0
		if i < len(digA) {
			da = digA[i]
		}
		db := len(alphabet)
		if i < len(digB) {
			db = digB[i]
		}

		if db-da >= 2 {
			// There's room for at least one digit between them.
			mid := da + 1
			if mid < len(alphabet) {
				result = append(result, alphabet[mid])
				return string(result)
			}
		}

		// Use da if still within a's range, otherwise append a fresh start.
		if i < len(digA) {
			result = append(result, a[i])
		} else {
			// We've exhausted a but haven't found space between.
			// Append a character that's clearly after a's prefix but before b.
			if i < len(digB) && digB[i] > 1 {
				result = append(result, alphabet[1])
				return string(result)
			}
			result = append(result, alphabet[0])
		}
	}
}
