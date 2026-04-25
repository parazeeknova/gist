package main

import (
	"net/http"
	"os"

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

func init() {
	profile.Links.Portfolio = Link{Label: "designer portfolio", URL: "https://folio.zephyyrr.in"}
	profile.Links.Zephyr = Link{Label: "Zephyr", URL: "https://zephyyrr.in"}
	profile.Links.Singularity = Link{Label: "Singularity Works", URL: "https://singularityworks.xyz"}
	profile.Links.GitHub = Link{Label: "GitHub", URL: "https://github.com/parazeeknova"}
	profile.Links.LinkedIn = Link{Label: "LinkedIn", URL: "https://www.linkedin.com/in/hashk"}
	profile.Links.Twitter = Link{Label: "X", URL: "https://x.com/hashcodes_"}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
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
	}

	if err := r.Run(":" + port); err != nil {
		panic(err)
	}
}
