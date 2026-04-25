import { useQuery } from "@tanstack/react-query";
import type { Profile, ExperienceItem, Project } from "../types";

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const useProfile = () =>
  useQuery<Profile>({
    queryFn: () => fetchJson<Profile>("/api/profile"),
    queryKey: ["profile"],
  });

export const useExperience = () =>
  useQuery<ExperienceItem[]>({
    queryFn: () => fetchJson<ExperienceItem[]>("/api/experience"),
    queryKey: ["experience"],
  });

export const useProjects = () =>
  useQuery<Project[]>({
    queryFn: () => fetchJson<Project[]>("/api/projects"),
    queryKey: ["projects"],
  });

export const useIsFetchingData = (): boolean => {
  const profile = useProfile();
  const experience = useExperience();
  const projects = useProjects();

  return profile.isPending || experience.isPending || projects.isPending;
};
