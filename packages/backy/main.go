package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Profile struct {
	Name        string `json:"name"`
	Tagline     string `json:"tagline"`
	Description string `json:"description"`
	Links       struct {
		Portfolio   Link `json:"portfolio"`
		Zephyr      Link `json:"zephyr"`
		Singularity Link `json:"singularity"`
		GitHub      Link `json:"github"`
		LinkedIn    Link `json:"linkedin"`
		Twitter     Link `json:"twitter"`
	} `json:"links"`
}

type Link struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

type ExperienceItem struct {
	Title    string `json:"title"`
	Location string `json:"location"`
	Period   string `json:"period"`
}

type Project struct {
	Title string `json:"title"`
	Desc  string `json:"desc"`
	Stack string `json:"stack"`
}

type GitHubStats struct {
	CommitsThisMonth int `json:"commitsThisMonth"`
	TotalCommits     int `json:"totalCommits"`
	PRsThisMonth     int `json:"prsThisMonth"`
}

var profile = Profile{
	Name:    "Harsh Sahu",
	Tagline: "designer portfolio",
	Description: "Engineer and founder, building web platforms, infrastructure, and tools. " +
		"Creator of Zephyr. Runs Singularity Works, a freelance design and development studio. " +
		"CS undergrad, active in open-source and hackathons.",
}

var experiences = []ExperienceItem{
	{
		Title:    "Co-Founder — Singularity Works",
		Location: "On-Site (Bhopal, India)",
		Period:   "August 2025–Present",
	},
	{
		Title:    "Full Stack Developer Intern — amasQIS.ai",
		Location: "Remote (Muscat, Oman)",
		Period:   "April 2025–Present",
	},
	{
		Title:    "President — Mozilla Firefox Club",
		Location: "On-Site (Bhopal, India)",
		Period:   "June 2025–Present",
	},
}

var projects = []Project{
	{
		Title: "Zephyr is a Social media aggregator and platform",
		Desc:  "Unified feeds from major networks with 10K+ views in beta, optimized API latency 300ms→25ms via self-hosted stack.",
		Stack: "Next.js, TypeScript, PostgreSQL, Redis, MinIO, Docker",
	},
	{
		Title: "Zephara is a Real-time chat platform",
		Desc:  "Features threads, reactions, edits, media sharing with a modern interface in the Zephyr ecosystem.",
		Stack: "Next.js, TypeScript, Convex, Vercel",
	},
	{
		Title: "Snix is a Terminal snippet manager",
		Desc:  "Fast TUI with hierarchical notebooks, fuzzy search, syntax highlighting for 25+ languages, and versioned storage.",
		Stack: "Rust, Ratatui",
	},
	{
		Title: "Nyxtext Zenith is a Keyboard-first code editor",
		Desc:  "Windows code editor with built-in terminal. Supports 35+ languages, code folding, Lua customization, and QScintilla-based editing.",
		Stack: "Python, PyQt, QScintilla",
	},
	{
		Title: "Vue-the-World is a Travel tracker",
		Desc:  "Full-stack travel tracker. Log visited places and visualize journeys on an interactive map.",
		Stack: "Nuxt, Vue.js, TypeScript",
	},
}

type githubEvent struct {
	Type      string `json:"type"`
	CreatedAt string `json:"created_at"`
	Payload   struct {
		Size int `json:"size"`
	} `json:"payload"`
}

type githubSearchResult struct {
	TotalCount int `json:"total_count"`
}

func init() {
	profile.Links.Portfolio = Link{Label: "designer portfolio", URL: "https://folio.zephyyrr.in"}
	profile.Links.Zephyr = Link{Label: "Zephyr", URL: "https://zephyyrr.in"}
	profile.Links.Singularity = Link{Label: "Singularity Works", URL: "https://singularityworks.xyz"}
	profile.Links.GitHub = Link{Label: "GitHub", URL: "https://github.com/parazeeknova"}
	profile.Links.LinkedIn = Link{Label: "LinkedIn", URL: "https://www.linkedin.com/in/hashk"}
	profile.Links.Twitter = Link{Label: "X", URL: "https://x.com/hashcodes_"}
}

func fetchGitHubEvents(client *http.Client, token, username string) ([]githubEvent, error) {
	req, err := http.NewRequest("GET",
		fmt.Sprintf("https://api.github.com/users/%s/events/public?per_page=100", username), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _ = res.Body.Close() }()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github events API %d", res.StatusCode)
	}

	var events []githubEvent
	if err := json.NewDecoder(res.Body).Decode(&events); err != nil {
		return nil, err
	}
	return events, nil
}

func fetchGitHubPRs(client *http.Client, token, username string) (int, error) {
	now := time.Now()
	firstDay := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	dateStr := firstDay.Format("2006-01-02")

	url := fmt.Sprintf(
		"https://api.github.com/search/issues?q=author:%s+type:pr+created:>%s&per_page=1",
		username, dateStr)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	res, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer func() { _ = res.Body.Close() }()

	if res.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("github search API %d", res.StatusCode)
	}

	var result githubSearchResult
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return 0, err
	}
	return result.TotalCount, nil
}

func computeGitHubStats(token, username string) (GitHubStats, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	events, err := fetchGitHubEvents(client, token, username)
	if err != nil {
		return GitHubStats{}, err
	}

	prs, err := fetchGitHubPRs(client, token, username)
	if err != nil {
		return GitHubStats{}, err
	}

	now := time.Now()
	firstDay := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	var commitsThisMonth, totalCommits int
	for _, event := range events {
		if event.Type == "PushEvent" {
			totalCommits += event.Payload.Size
			if eventDate, err := time.Parse(time.RFC3339, event.CreatedAt); err == nil && eventDate.After(firstDay) {
				commitsThisMonth += event.Payload.Size
			}
		}
	}

	return GitHubStats{
		CommitsThisMonth: commitsThisMonth,
		TotalCommits:     totalCommits,
		PRsThisMonth:     prs,
	}, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	githubToken := os.Getenv("GITHUB_TOKEN")
	githubUsername := os.Getenv("GITHUB_USERNAME")
	if githubUsername == "" {
		githubUsername = "parazeeknova"
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.GET("/profile", func(c *gin.Context) {
			c.JSON(http.StatusOK, profile)
		})

		api.GET("/experience", func(c *gin.Context) {
			c.JSON(http.StatusOK, experiences)
		})

		api.GET("/projects", func(c *gin.Context) {
			c.JSON(http.StatusOK, projects)
		})

		api.GET("/github/stats", func(c *gin.Context) {
			stats, err := computeGitHubStats(githubToken, githubUsername)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, stats)
		})
	}

	if err := r.Run(":" + port); err != nil {
		panic(err)
	}
}
