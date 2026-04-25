export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  tagline: string;
  description: string;
  links: {
    portfolio: Link;
    zephyr: Link;
    singularity: Link;
    github: Link;
    linkedin: Link;
    twitter: Link;
  };
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
