import { useQuery } from "@tanstack/react-query";
import type { BlogPost } from "../types";

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const useBlogPost = (slug: string) =>
  useQuery<BlogPost>({
    queryFn: ({ signal }) => fetchJson<BlogPost>(`/api/blogs/${slug}`, { signal }),
    queryKey: ["blog-post", slug],
  });
