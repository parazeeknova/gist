import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProfile, useExperience, useProjects, useIsFetchingData } from "./use-data";
import { createWrapper } from "../test/utils";

describe("useProfile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches profile data successfully", async () => {
    const mockProfile = {
      description: "test description",
      links: {
        portfolio: { label: "Portfolio", url: "https://example.com" },
      },
      name: "Test User",
      tagline: "test tagline",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => mockProfile,
      ok: true,
    } as Response);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isPending).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith("/api/profile", expect.any(Object));
  });

  it("handles fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it("throws error on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain("404");
  });
});

describe("useExperience", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("fetches experience data successfully", async () => {
    const mockExperience = [
      {
        location: "Remote",
        period: "2024-Present",
        title: "Test Job",
      },
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => mockExperience,
      ok: true,
    } as Response);

    const { result } = renderHook(() => useExperience(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockExperience);
  });
});

describe("useProjects", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("fetches projects data successfully", async () => {
    const mockProjects = [
      {
        desc: "Test description",
        stack: "React, TypeScript",
        title: "Test Project",
      },
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => mockProjects,
      ok: true,
    } as Response);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
  });
});

describe("useIsFetchingData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns true when any query is pending", () => {
    // Create a deferred promise that never resolves
    let resolvePromise: (value: unknown) => void;
    // eslint-disable-next-line promise/avoid-new
    const deferredPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(deferredPromise);

    const { result } = renderHook(() => useIsFetchingData(), {
      wrapper: createWrapper(),
    });

    // Should be true while loading
    expect(result.current).toBe(true);

    // Clean up by resolving (avoid unhandled promise)
    resolvePromise({ json: () => ({}), ok: true });
  });
});
