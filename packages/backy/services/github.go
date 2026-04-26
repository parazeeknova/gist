package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gist/backy/models"
)

// GitHubService provides GitHub API operations
type GitHubService struct {
	client  *http.Client
	baseURL string
}

// NewGitHubService creates a new GitHub service with the given timeout
func NewGitHubService(timeout time.Duration) *GitHubService {
	return &GitHubService{
		client:  &http.Client{Timeout: timeout},
		baseURL: "https://api.github.com",
	}
}

// FetchOrgs fetches the organizations a user belongs to
func (s *GitHubService) FetchOrgs(ctx context.Context, username string) ([]models.GitHubOrg, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("%s/users/%s/orgs?per_page=100", s.baseURL, username), nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	res, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github API returned %d", res.StatusCode)
	}

	var orgs []models.GitHubOrg
	if err := json.NewDecoder(res.Body).Decode(&orgs); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	// Populate URLs if missing
	for i := range orgs {
		if orgs[i].HtmlURL == "" {
			orgs[i].HtmlURL = fmt.Sprintf("https://github.com/%s", orgs[i].Login)
		}
		if orgs[i].URL == "" {
			orgs[i].URL = fmt.Sprintf("%s/orgs/%s", s.baseURL, orgs[i].Login)
		}
	}

	return orgs, nil
}

// FetchContributions fetches contribution stats from GitHub GraphQL API
func (s *GitHubService) FetchContributions(
	ctx context.Context,
	token string,
	username string,
	from time.Time,
	to time.Time,
) (commits, prs int, err error) {
	query := `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
    }
  }
}`

	payload := models.GraphQLRequest{
		Query: query,
		Variables: map[string]interface{}{
			"login": username,
			"from":  from.Format(time.RFC3339),
			"to":    to.Format(time.RFC3339),
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return 0, 0, fmt.Errorf("marshaling query: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.github.com/graphql", bytes.NewReader(body))
	if err != nil {
		return 0, 0, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	res, err := s.client.Do(req)
	if err != nil {
		return 0, 0, fmt.Errorf("executing request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("github API returned %d", res.StatusCode)
	}

	var result models.GraphQLResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return 0, 0, fmt.Errorf("decoding response: %w", err)
	}

	if len(result.Errors) > 0 {
		return 0, 0, fmt.Errorf("graphql error: %s", result.Errors[0].Message)
	}

	if result.Data.User == nil {
		return 0, 0, fmt.Errorf("user not found")
	}

	collection := result.Data.User.ContributionsCollection
	return collection.TotalCommitContributions, collection.TotalPullRequestContributions, nil
}

// ComputeStats calculates GitHub statistics for a user
func (s *GitHubService) ComputeStats(
	ctx context.Context,
	token string,
	username string,
) (models.GitHubStats, error) {
	now := time.Now().UTC()
	firstDay := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Current month stats
	commitsThisMonth, prsThisMonth, err := s.FetchContributions(ctx, token, username, firstDay, now)
	if err != nil {
		return models.GitHubStats{}, fmt.Errorf("fetching current month: %w", err)
	}

	// Last year stats
	lastYear := now.AddDate(-1, 0, 0)
	commitsLastYear, _, err := s.FetchContributions(ctx, token, username, lastYear, now)
	if err != nil {
		return models.GitHubStats{}, fmt.Errorf("fetching last year: %w", err)
	}

	// Organizations
	orgs, err := s.FetchOrgs(ctx, username)
	if err != nil {
		orgs = []models.GitHubOrg{}
	}

	return models.GitHubStats{
		CommitsThisMonth: commitsThisMonth,
		CommitsLastYear:  commitsLastYear,
		PRsThisMonth:     prsThisMonth,
		Orgs:             orgs,
	}, nil
}
