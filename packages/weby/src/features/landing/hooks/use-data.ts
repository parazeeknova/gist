import type { BlogManifestSection, ExperienceItem, Profile, Project } from "#/types";
import { useQuery } from "@tanstack/react-query";

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const useProfile = () =>
  useQuery<Profile>({
    queryFn: ({ signal }) => fetchJson<Profile>("/api/profile", { signal }),
    queryKey: ["profile"],
  });

export const useExperience = () =>
  useQuery<ExperienceItem[]>({
    queryFn: ({ signal }) => fetchJson<ExperienceItem[]>("/api/experience", { signal }),
    queryKey: ["experience"],
  });

export const useProjects = () =>
  useQuery<Project[]>({
    queryFn: ({ signal }) => fetchJson<Project[]>("/api/projects", { signal }),
    queryKey: ["projects"],
  });

export const useBlogManifest = () =>
  useQuery<BlogManifestSection[]>({
    queryFn: ({ signal }) => fetchJson<BlogManifestSection[]>("/api/blogs", { signal }),
    queryKey: ["blogManifest"],
  });

export const useIsFetchingData = (): boolean => {
  const profile = useProfile();
  const experience = useExperience();
  const projects = useProjects();

  return profile.isPending || experience.isPending || projects.isPending;
};
