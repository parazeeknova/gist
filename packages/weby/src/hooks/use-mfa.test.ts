import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../test/utils";
import {
  useMFAStatus,
  useMFASetup,
  useMFAEnable,
  useMFADisable,
  useMFABackupCodes,
  useMFAVerify,
} from "./use-mfa";

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

describe("useMFAStatus", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns MFA status when available", async () => {
    const mockStatus = {
      is_enabled: false,
      method: "totp",
      workspace_enforced: false,
    };
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockStatus));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFAStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStatus);
  });

  it("handles error response", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({ error: "unauthorized" }, false, 401));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFAStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useMFASetup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns setup data on success", async () => {
    const mockSetup = {
      manual_key: "test-secret",
      qr_uri: "otpauth://totp/test",
      secret: "test-secret",
    };
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockSetup));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFASetup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSetup);
  });

  it("handles error on setup failure", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({ error: "already enabled" }, false, 409));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFASetup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("already enabled");
  });
});

describe("useMFAEnable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns backup codes on success", async () => {
    const mockCodes = {
      codes: ["CODE1", "CODE2", "CODE3"],
    };
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockCodes));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFAEnable(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ code: "123456" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCodes);
  });
});

describe("useMFADisable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("succeeds on valid password", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "ok" }));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFADisable(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ password: "current-password" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it("handles invalid password", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({ error: "invalid password" }, false, 401));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFADisable(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ password: "wrong-password" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("invalid password");
  });
});

describe("useMFABackupCodes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns new backup codes", async () => {
    const mockCodes = {
      codes: ["BACKUP1", "BACKUP2"],
    };
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockCodes));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFABackupCodes(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCodes);
  });
});

describe("useMFAVerify", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("succeeds on valid code", async () => {
    const mockUser = {
      id: "test-id",
      username: "testuser",
    };
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockUser));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFAVerify(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ code: "123456" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
  });

  it("handles invalid code", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse({ error: "invalid code" }, false, 401));
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useMFAVerify(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ code: "000000" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("invalid code");
  });
});
