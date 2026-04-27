const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const getBackyOrigin = (): string => {
  const explicitOrigin = process.env.BACKY_ORIGIN;
  if (explicitOrigin && explicitOrigin.trim().length > 0) {
    return explicitOrigin;
  }

  const host = process.env.BACKY_HOST ?? "localhost";
  const port = process.env.BACKY_PORT ?? "8080";
  return `http://${host}:${port}`;
};

const copyForwardHeaders = (headers: Headers): Headers => {
  const forwarded = new Headers();

  for (const [key, value] of headers.entries()) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === "host" || normalizedKey === "content-length") {
      continue;
    }

    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      continue;
    }

    forwarded.append(key, value);
  }

  return forwarded;
};

export const resolveBackyUrl = (request: Request, splat: string | undefined): string => {
  const requestUrl = new URL(request.url);
  const normalizedOrigin = getBackyOrigin().endsWith("/")
    ? getBackyOrigin()
    : `${getBackyOrigin()}/`;
  const targetUrl = new URL(splat ?? "", normalizedOrigin);
  targetUrl.search = requestUrl.search;
  return targetUrl.toString();
};

export const buildBackyRequestInit = async (request: Request): Promise<RequestInit> => {
  const method = request.method.toUpperCase();
  const requestInit: RequestInit = {
    headers: copyForwardHeaders(request.headers),
    method,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    requestInit.body = await request.arrayBuffer();
  }

  return requestInit;
};

export const createProxiedResponse = (upstreamResponse: Response): Response =>
  new Response(upstreamResponse.body, {
    headers: copyForwardHeaders(upstreamResponse.headers),
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
