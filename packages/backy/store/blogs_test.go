package store

import "testing"

func TestGetBlogPostNotFound(t *testing.T) {
	_, err := GetBlogPost("crdts-101-a-primer")
	if err != ErrBlogPostNotFound {
		t.Errorf("Expected ErrBlogPostNotFound, got %v", err)
	}
}

func TestGetBlogManifestEmpty(t *testing.T) {
	manifest := GetBlogManifest()
	if len(manifest) != 0 {
		t.Errorf("Expected empty manifest, got %d sections", len(manifest))
	}
}
