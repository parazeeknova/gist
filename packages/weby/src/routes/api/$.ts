import { createFileRoute } from "@tanstack/react-router";
import {
  buildBackyRequestInit,
  createProxiedResponse,
  resolveBackyUrl,
} from "../../server/backy-proxy";

const proxyRequest = async ({
  params,
  request,
}: {
  params: { _splat?: string };
  request: Request;
}) => {
  const upstreamUrl = resolveBackyUrl(request, params._splat);
  const upstreamRequest = await buildBackyRequestInit(request);
  const upstreamResponse = await fetch(upstreamUrl, upstreamRequest);
  return createProxiedResponse(upstreamResponse);
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      DELETE: proxyRequest,
      GET: proxyRequest,
      HEAD: proxyRequest,
      OPTIONS: proxyRequest,
      PATCH: proxyRequest,
      POST: proxyRequest,
      PUT: proxyRequest,
    },
  },
});
