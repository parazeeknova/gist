package store

import "github.com/gist/backy/models"

// Static data stores

var Profile = models.Profile{
	Name:    "Harsh Sahu",
	Tagline: "designer portfolio",
	Description: "Engineer and founder, building web platforms, infrastructure, and tools. " +
		"Creator of Zephyr. Runs Singularity Works, a freelance design and development studio. " +
		"CS undergrad, active in open-source and hackathons.",
	Links: map[string]models.Link{
		"portfolio":   {Label: "designer portfolio", URL: "https://folio.zephyyrr.in"},
		"zephyr":      {Label: "Zephyr", URL: "https://zephyyrr.in"},
		"singularity": {Label: "Singularity Works", URL: "https://itsingularity.com"},
		"github":      {Label: "GitHub", URL: "https://github.com/parazeeknova"},
		"linkedin":    {Label: "LinkedIn", URL: "https://www.linkedin.com/in/hashk"},
		"twitter":     {Label: "X", URL: "https://x.com/parazeeknova"},
	},
}

var Experiences = []models.ExperienceItem{
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

var Projects = []models.Project{
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
