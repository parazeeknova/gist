import type {
  AuthUser,
  BlogManifestSection,
  BlogPost,
  BootstrapState,
  ConsolePage,
  ConsolePageDetail,
  ExperienceItem,
  Profile,
  Project,
  Stats,
} from "#/types";

const getBackyOrigin = (): string => {
  const origin = process.env.BACKY_ORIGIN;
  if (origin && origin.trim().length > 0) {
    return origin.endsWith("/") ? origin : `${origin}/`;
  }
  return "http://localhost:7000/";
};

export class BackyError extends Error {
  body: string;
  ok = false as const;
  status: number;

  constructor(status: number, body: string) {
    super(`Backy HTTP ${status}`);
    this.body = body;
    this.name = "BackyError";
    this.status = status;
  }
}

const fetchBacky = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const origin = getBackyOrigin();
  const url = new URL(`api/${endpoint}`, origin).toString();

  // Normalize headers via the Headers API to handle all HeadersInit shapes
  // (plain object, Headers instance, [string,string][]).
  const normalized = new Headers(init?.headers);
  normalized.set("Accept", "application/json");

  const { headers: _, ...restInit } = init ?? {};
  const mergedInit: RequestInit = {
    ...restInit,
    headers: normalized,
  };

  const response = await fetch(url, mergedInit);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new BackyError(response.status, body);
  }

  return response.json() as Promise<T>;
};

const buildBackyUrl = (endpoint: string): string => {
  const origin = getBackyOrigin();
  return new URL(`api/${endpoint}`, origin).toString();
};

export const getProfile = () => fetchBacky<Profile>("profile");

export const getExperience = () => fetchBacky<ExperienceItem[]>("experience");

export const getProjects = () => fetchBacky<Project[]>("projects");

export const getGitHubStats = () => fetchBacky<unknown>("github/stats");

export const getBlogPost = (slug: string) => fetchBacky<BlogPost>(`blogs/${slug}`);

export const getBlogManifest = () => fetchBacky<BlogManifestSection[]>("blogs");

export const getBootstrapState = () => fetchBacky<BootstrapState>("auth/bootstrap-state");

export const getStats = () => fetchBacky<Stats>("stats");

export const getAuthMe = (cookieHeader?: string | null) =>
  fetchBacky<AuthUser>("auth/me", {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

export const postBacky = (endpoint: string, body: unknown): Promise<Response> => {
  const url = buildBackyUrl(endpoint);
  return fetch(url, {
    body: JSON.stringify(body),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    method: "POST",
  });
};

export const postBackyWithCookies = (
  endpoint: string,
  body: unknown,
  cookieHeader?: string | null,
): Promise<Response> => {
  const url = buildBackyUrl(endpoint);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  return fetch(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
};

export const getConsolePages = (cookieHeader?: string | null) =>
  fetchBacky<ConsolePage[]>("console/pages", {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

export const getConsolePage = (id: string, cookieHeader?: string | null) =>
  fetchBacky<ConsolePageDetail>(`console/pages/${id}`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });
