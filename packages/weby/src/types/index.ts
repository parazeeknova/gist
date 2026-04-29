export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  description: string;
  links: Record<string, Link>;
  name: string;
  tagline: string;
}

export interface ExperienceItem {
  location: string;
  period: string;
  title: string;
}

export interface Project {
  desc: string;
  readmeUrl?: string;
  stack: string;
  title: string;
}

export interface BlogHeading {
  id: string;
  label: string;
  level: number;
}

export interface BlogPost {
  description: string;
  format: "markdown";
  headings?: BlogHeading[];
  markdown: string;
  publishedAt: string;
  readTimeMinutes: number;
  section: string;
  slug: string;
  tags: string[];
  title: string;
}
