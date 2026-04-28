package store

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"github.com/verso/backy/models"
)

var ErrBlogPostNotFound = errors.New("blog post not found")

type blogSource struct {
	Description     string
	FilePath        string
	PublishedAt     string
	ReadTimeMinutes int
	Section         string
	Tags            []string
	Title           string
}

// getContentPath returns the absolute path to the content directory
func getContentPath() string {
	// Get the directory of the current source file
	_, filename, _, _ := runtime.Caller(0)
	// filename is .../packages/backy/store/blogs.go
	// We want .../packages/backy/content
	storeDir := filepath.Dir(filename)
	backyDir := filepath.Dir(storeDir)
	return filepath.Join(backyDir, "content")
}

var blogSources = map[string]blogSource{
	"crdts-101-a-primer": {
		Description:     "Conflict-free Replicated Data Types (CRDTs) are a class of data structures that allow replicated data to be merged automatically, without conflicts. They are the backbone of many modern distributed systems.",
		FilePath:        filepath.Join(getContentPath(), "blogs", "distributed-systems", "crdt.md"),
		PublishedAt:     "2025-08-28",
		ReadTimeMinutes: 8,
		Section:         "distributed-systems",
		Tags:            []string{"distributed-systems", "crdt", "consistency"},
		Title:           "CRDTs 101: A Primer",
	},
}

func GetBlogPost(slug string) (models.BlogPost, error) {
	source, ok := blogSources[slug]
	if !ok {
		return models.BlogPost{}, ErrBlogPostNotFound
	}

	markdown, err := os.ReadFile(source.FilePath)
	if err != nil {
		return models.BlogPost{}, fmt.Errorf("read blog post %q: %w", slug, err)
	}

	return models.BlogPost{
		Description:     source.Description,
		Format:          "markdown",
		Markdown:        string(markdown),
		PublishedAt:     source.PublishedAt,
		ReadTimeMinutes: source.ReadTimeMinutes,
		Section:         source.Section,
		Slug:            slug,
		Tags:            source.Tags,
		Title:           source.Title,
	}, nil
}
