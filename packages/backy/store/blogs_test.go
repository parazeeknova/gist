package store

import "testing"

func TestGetBlogPost(t *testing.T) {
	post, err := GetBlogPost("crdts-101-a-primer")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if post.Slug != "crdts-101-a-primer" {
		t.Errorf("Expected slug 'crdts-101-a-primer', got '%s'", post.Slug)
	}
	if post.Markdown == "" {
		t.Fatal("Expected markdown content, got empty")
	}
}

func TestGetBlogPostNotFound(t *testing.T) {
	_, err := GetBlogPost("non-existent-post")
	if err != ErrBlogPostNotFound {
		t.Errorf("Expected ErrBlogPostNotFound, got %v", err)
	}
}

func TestGetBlogPostAll(t *testing.T) {
	slug := "crdts-101-a-primer"
	post, err := GetBlogPost(slug)
	if err != nil {
		t.Fatalf("GetBlogPost(%q) error: %v", slug, err)
	}
	if post.Title == "" {
		t.Errorf("GetBlogPost(%q) title is empty", slug)
	}
	if post.Format != "markdown" {
		t.Errorf("GetBlogPost(%q) format = %q, want 'markdown'", slug, post.Format)
	}
	if len(post.Tags) == 0 {
		t.Errorf("GetBlogPost(%q) tags is empty", slug)
	}
}
