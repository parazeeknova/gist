import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../test/utils";
import { useUpdateWorkspace } from "./use-workspace-settings";

const createMockResponse = (data: unknown, ok = true, status = 200): Response => {
  const body = JSON.stringify(data);
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: () => Promise.resolve(data),
    ok,
    status,
    text: () => Promise.resolve(body),
  } as unknown as Response;
};

describe("useUpdateWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates workspace successfully", async () => {
    const updatedWorkspace = {
      createdAt: "2024-01-01",
      icon: "data:image/png;base64,abc",
      id: "ws-1",
      name: "new name",
      slug: "new-name",
      updatedAt: "2024-01-02",
    };

    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(updatedWorkspace));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useUpdateWorkspace(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "ws-1",
      input: { icon: "data:image/png;base64,abc", name: "new name", slug: "new-name" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(updatedWorkspace);

    const updateCall = mockFetch.mock.calls.find((call: unknown[]) =>
      (call[0] as string).includes("/api/console/workspaces/ws-1"),
    );
    expect(updateCall).toBeDefined();

    const init = updateCall?.[1] as RequestInit | undefined;
    expect(init?.method).toBe("PUT");
    const body = JSON.parse(init?.body as string);
    expect(body).toEqual({ icon: "data:image/png;base64,abc", name: "new name", slug: "new-name" });
  });

  it("handles update error", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({ error: "workspace not found" }, false, 404));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useUpdateWorkspace(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "ws-1",
      input: { icon: "", name: "new name", slug: "new-name" },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
