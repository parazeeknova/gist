import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createWrapper } from "../test/utils";
import { useBlogPost } from "./use-blog-post";

const createMockResponse = (data: unknown, ok = true): Response =>
  ({
    json: () => Promise.resolve(data),
    ok,
  }) as Response;

describe("useBlogPost", () => {
  it("fetches a blog post by slug", async () => {
    const mockPost = {
      description: "test description",
      format: "markdown",
      markdown: "# why crdts?",
      publishedAt: "2025-08-28",
      readTimeMinutes: 8,
      section: "distributed-systems",
      slug: "crdts-101-a-primer",
      tags: ["distributed-systems", "crdt", "consistency"],
      title: "CRDTs 101: A Primer",
    };

    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockPost));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useBlogPost("crdts-101-a-primer"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPost);
    expect(mockFetch).toHaveBeenCalledWith("/api/blogs/crdts-101-a-primer", expect.any(Object));
  });
});
