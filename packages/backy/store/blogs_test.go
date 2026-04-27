package store

import (
	"testing"

	"github.com/verso/backy/models"
)

func TestExtractHeadings(t *testing.T) {
	markdown := `# why crdts?

Some content here.

## core properties

More content.

### sub-heading

## types of crdts

### another sub-heading

## example: g-counter

Some code.

## when to use crdts?
`

	headings := extractHeadings(markdown)

	if len(headings) == 0 {
		t.Fatal("Expected headings, got empty")
	}

	expected := []models.BlogHeading{
		{ID: "why-crdts", Label: "why crdts?", Level: 1},
		{ID: "core-properties", Label: "core properties", Level: 2},
		{ID: "sub-heading", Label: "sub-heading", Level: 3},
		{ID: "types-of-crdts", Label: "types of crdts", Level: 2},
		{ID: "another-sub-heading", Label: "another sub-heading", Level: 3},
		{ID: "example-g-counter", Label: "example: g-counter", Level: 2},
		{ID: "when-to-use-crdts", Label: "when to use crdts?", Level: 2},
	}

	if len(headings) != len(expected) {
		t.Fatalf("Expected %d headings, got %d", len(expected), len(headings))
	}

	for i, h := range headings {
		if h.ID != expected[i].ID || h.Label != expected[i].Label || h.Level != expected[i].Level {
			t.Errorf("Heading %d mismatch: got {ID:%s, Label:%s, Level:%d}, want {ID:%s, Label:%s, Level:%d}",
				i, h.ID, h.Label, h.Level, expected[i].ID, expected[i].Label, expected[i].Level)
		}
	}
}
