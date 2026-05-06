import { createFileRoute } from "@tanstack/react-router";
import { postBacky } from "#/server/backy";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const backyRes = await postBacky("auth/login", body);
        const data = await backyRes
          .text()
          .catch(() => '{"error":"authentication service unavailable"}');
        const responseHeaders = new Headers({ "Content-Type": "application/json" });
        for (const cookie of backyRes.headers.getSetCookie()) {
          responseHeaders.append("set-cookie", cookie);
        }
        return new Response(data, {
          headers: responseHeaders,
          status: backyRes.status,
        });
      },
    },
  },
});
