export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  description: string;
  email?: string;
  links: Record<string, Link>;
  name: string;
  tagline: string;
  username?: string;
}

export interface ExperienceItem {
  location: string;
  period: string;
  title: string;
}

export interface Project {
  desc: string;
  productUrl?: string;
  readmeUrl?: string;
  repoUrl?: string;
  stack: string;
  title: string;
}

export interface BlogHeading {
  id: string;
  label: string;
  level: number;
}

export interface BlogManifestSection {
  label: string;
  children: BlogManifestPost[];
}

export interface BlogManifestPost {
  slug: string;
  title: string;
  section: string;
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
  contentJson?: Record<string, unknown>;
  icon?: string;
  coverPhoto?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isOwner: boolean;
}

export interface BootstrapState {
  bootstrapped: boolean;
}

export interface Stats {
  pages: number;
  posts: number;
  readmes: number;
}

export interface ConsolePage {
  id: string;
  slugId: string;
  title: string;
  icon: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsolePageDetail {
  id: string;
  slugId: string;
  title: string;
  icon: string;
  coverPhoto: string;
  contentJson: string;
  textContent: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
