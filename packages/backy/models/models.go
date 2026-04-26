package models

// Link represents a labeled URL link
type Link struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

// Profile represents user profile data
type Profile struct {
	Name        string          `json:"name"`
	Tagline     string          `json:"tagline"`
	Description string          `json:"description"`
	Links       map[string]Link `json:"links"`
}

// ExperienceItem represents a work experience entry
type ExperienceItem struct {
	Title    string `json:"title"`
	Location string `json:"location"`
	Period   string `json:"period"`
}

// Project represents a project entry
type Project struct {
	Title string `json:"title"`
	Desc  string `json:"desc"`
	Stack string `json:"stack"`
}

// GitHubOrg represents a GitHub organization
type GitHubOrg struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	URL       string `json:"url"`
	HtmlURL   string `json:"html_url"`
}

// GitHubStats represents GitHub statistics
type GitHubStats struct {
	CommitsThisMonth int         `json:"commitsThisMonth"`
	CommitsLastYear  int         `json:"commitsLastYear"`
	PRsThisMonth     int         `json:"prsThisMonth"`
	Orgs             []GitHubOrg `json:"orgs"`
}

// GraphQLRequest represents a GraphQL request payload
type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

// GraphQLResponse represents a GraphQL response
type GraphQLResponse struct {
	Data struct {
		User *struct {
			ContributionsCollection struct {
				TotalCommitContributions      int `json:"totalCommitContributions"`
				TotalPullRequestContributions int `json:"totalPullRequestContributions"`
			} `json:"contributionsCollection"`
		} `json:"user"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}
