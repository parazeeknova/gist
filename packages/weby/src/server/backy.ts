import type { BlogManifestSection, BlogPost, ExperienceItem, Profile, Project } from "#/types";

const getBackyOrigin = (): string => {
  const origin = process.env.BACKY_ORIGIN;
  if (origin && origin.trim().length > 0) {
    return origin.endsWith("/") ? origin : `${origin}/`;
  }
  return "http://localhost:7000/";
};

const fetchBacky = async <T>(endpoint: string): Promise<T> => {
  const origin = getBackyOrigin();
  const url = new URL(`api/${endpoint}`, origin).toString();

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Backy API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const getProfile = () => fetchBacky<Profile>("profile");

export const getExperience = () => fetchBacky<ExperienceItem[]>("experience");

export const getProjects = () => fetchBacky<Project[]>("projects");

export const getGitHubStats = () => fetchBacky<unknown>("github/stats");

export const getBlogPost = (slug: string) => fetchBacky<BlogPost>(`blogs/${slug}`);

export const getBlogManifest = () => fetchBacky<BlogManifestSection[]>("blogs");
