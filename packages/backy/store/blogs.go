package store

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

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

// extractHeadings extracts heading text and levels from markdown content using regex
func extractHeadings(markdownContent string) []models.BlogHeading {
	// Regex to match markdown headings: #, ##, ###, etc.
	re := regexp.MustCompile(`^(#{1,6})\s+(.+)$`)
	lines := strings.Split(markdownContent, "\n")
	var headings []models.BlogHeading

	for _, line := range lines {
		matches := re.FindStringSubmatch(line)
		if matches != nil {
			level := len(matches[1])
			label := strings.TrimSpace(matches[2])
			id := slugify(label)

			headings = append(headings, models.BlogHeading{
				ID:    id,
				Label: label,
				Level: level,
			})
		}
	}

	return headings
}

// slugify converts a heading label to a URL-friendly ID
func slugify(label string) string {
	// Convert to lowercase
	label = strings.ToLower(label)
	// Remove special characters
	re := regexp.MustCompile(`[^a-z0-9\s-]`)
	label = re.ReplaceAllString(label, "")
	// Replace spaces with hyphens
	label = strings.ReplaceAll(label, " ", "-")
	return label
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

	// Extract headings from markdown content
	headings := extractHeadings(string(markdown))

	return models.BlogPost{
		Description:     source.Description,
		Format:          "markdown",
		Headings:        headings,
		Markdown:        string(markdown),
		PublishedAt:     source.PublishedAt,
		ReadTimeMinutes: source.ReadTimeMinutes,
		Section:         source.Section,
		Slug:            slug,
		Tags:            source.Tags,
		Title:           source.Title,
	}, nil
}
