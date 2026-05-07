import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../test/utils";
import { useBootstrapState, useIsBootstrapped } from "./use-bootstrap-state";

const createMockResponse = (data: unknown, ok = true): Response =>
  ({
    json: () => Promise.resolve(data),
    ok,
  }) as unknown as Response;

describe("useBootstrapState", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns bootstrapped true when system is bootstrapped", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ bootstrapped: true }));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useBootstrapState(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ bootstrapped: true });
  });

  it("returns bootstrapped false when system is not bootstrapped", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ bootstrapped: false }));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useBootstrapState(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ bootstrapped: false });
  });

  it("handles fetch error", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useBootstrapState(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 10_000 },
    );
  });
});

describe("useIsBootstrapped", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns bootstrapped true when system is bootstrapped", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ bootstrapped: true }));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useIsBootstrapped(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.bootstrapped).toBe(true);
    });
    expect(result.current.loading).toBe(false);
  });

  it("returns bootstrapped false when not bootstrapped", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ bootstrapped: false }));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useIsBootstrapped(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.bootstrapped).toBe(false);
    });
    expect(result.current.loading).toBe(false);
  });

  it("signals loading while query is in flight", () => {
    // Create a promise that never resolves (simulates loading state)
    // eslint-disable-next-line promise/avoid-new
    const mockFetch = vi.fn().mockReturnValue(new Promise<void>(() => {}));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useIsBootstrapped(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.bootstrapped).toBeUndefined();
  });
});
