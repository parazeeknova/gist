export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  tagline: string;
  description: string;
  links: Record<string, Link>;
}

export interface ExperienceItem {
  title: string;
  location: string;
  period: string;
}

export interface Project {
  title: string;
  desc: string;
  stack: string;
}
