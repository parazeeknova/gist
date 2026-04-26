import { useQuery } from "@tanstack/react-query";
import type { ExperienceItem, Profile, Project } from "../types";

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

export const useIsFetchingData = (): boolean => {
  const profile = useProfile();
  const experience = useExperience();
  const projects = useProjects();

  return profile.isPending || experience.isPending || projects.isPending;
};
