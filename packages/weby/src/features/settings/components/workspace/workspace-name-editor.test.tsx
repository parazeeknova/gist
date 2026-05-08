import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "#/shared/test/utils";
import { WorkspaceNameEditor } from "./workspace-name-editor";

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

describe("WorkspaceNameEditor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders input with workspace name", () => {
    render(
      <WorkspaceNameEditor
        hasChanges={false}
        icon=""
        name="my workspace"
        onNameChange={vi.fn()}
        slug="my-workspace"
        workspaceId="ws-1"
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByDisplayValue("my workspace")).toBeDefined();
    expect(screen.getByText("name")).toBeDefined();
  });

  it("calls onNameChange when input changes", () => {
    const onNameChange = vi.fn();
    render(
      <WorkspaceNameEditor
        hasChanges={true}
        icon=""
        name="my workspace"
        onNameChange={onNameChange}
        slug="my-workspace"
        workspaceId="ws-1"
      />,
      { wrapper: createWrapper() },
    );

    const input = screen.getByDisplayValue("my workspace");
    fireEvent.change(input, { target: { value: "updated workspace" } });

    expect(onNameChange).toHaveBeenCalledWith("updated workspace");
  });

  it("saves name on button click", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({
        createdAt: "2024-01-01",
        icon: "",
        id: "ws-1",
        name: "updated workspace",
        slug: "my-workspace",
        updatedAt: "2024-01-02",
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    render(
      <WorkspaceNameEditor
        hasChanges={true}
        icon=""
        name="updated workspace"
        onNameChange={vi.fn()}
        slug="my-workspace"
        workspaceId="ws-1"
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByText("save"));

    await waitFor(() => {
      expect(screen.getByText("saved")).toBeDefined();
    });

    const updateCall = mockFetch.mock.calls.find((call: unknown[]) =>
      (call[0] as string).includes("/api/console/workspaces/ws-1"),
    );
    expect(updateCall).toBeDefined();
    const init = updateCall?.[1] as RequestInit | undefined;
    expect(init?.method).toBe("PUT");
  });

  it("does not save when name is empty", () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    render(
      <WorkspaceNameEditor
        hasChanges={false}
        icon=""
        name=""
        onNameChange={vi.fn()}
        slug="my-workspace"
        workspaceId="ws-1"
      />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByText("save"));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
