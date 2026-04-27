import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBackyRequestInit, createProxiedResponse, resolveBackyUrl } from "./backy-proxy";

describe("backy proxy helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves target URL from explicit BACKY_ORIGIN", () => {
    vi.stubEnv("BACKY_ORIGIN", "http://backy:8080/base");

    const request = new Request("https://weby.test/api/github/stats?month=current");
    const url = resolveBackyUrl(request, "github/stats");

    expect(url).toBe("http://backy:8080/base/github/stats?month=current");
  });

  it("resolves target URL from BACKY_HOST and BACKY_PORT", () => {
    vi.stubEnv("BACKY_HOST", "internal-backy");
    vi.stubEnv("BACKY_PORT", "9000");

    const request = new Request("https://weby.test/api/profile?lang=en");
    const url = resolveBackyUrl(request, "profile");

    expect(url).toBe("http://internal-backy:9000/profile?lang=en");
  });

  it("builds request init for POST and strips hop-by-hop headers", async () => {
    const request = new Request("https://weby.test/api/profile", {
      body: JSON.stringify({ ok: true }),
      headers: {
        connection: "keep-alive",
        "content-type": "application/json",
        host: "weby.test",
      },
      method: "POST",
    });

    const requestInit = await buildBackyRequestInit(request);
    const headers = requestInit.headers as Headers;

    expect(requestInit.method).toBe("POST");
    expect(requestInit.body).toBeDefined();
    expect(headers.get("connection")).toBeNull();
    expect(headers.get("host")).toBeNull();
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("builds request init for GET without body", async () => {
    const request = new Request("https://weby.test/api/projects", {
      method: "GET",
    });

    const requestInit = await buildBackyRequestInit(request);

    expect(requestInit.method).toBe("GET");
    expect(requestInit.body).toBeUndefined();
  });

  it("creates proxied response preserving status and body", async () => {
    const upstream = Response.json(
      { message: "ok" },
      {
        headers: {
          connection: "close",
        },
        status: 201,
        statusText: "Created",
      },
    );

    const proxied = createProxiedResponse(upstream);
    const body = await proxied.json();

    expect(proxied.status).toBe(201);
    expect(proxied.statusText).toBe("Created");
    expect(proxied.headers.get("connection")).toBeNull();
    expect(proxied.headers.get("content-type")).toBe("application/json");
    expect(body).toEqual({ message: "ok" });
  });
});
