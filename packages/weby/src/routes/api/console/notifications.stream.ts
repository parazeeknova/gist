import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/console/notifications/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return new Response("unauthorized", { status: 401 });
        }
        const backendOrigin =
          process.env.BACKY_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:7000";
        const backendRes = await fetch(`${backendOrigin}/api/console/notifications/stream`, {
          headers: cookieHeader ? { Cookie: cookieHeader } : {},
        });
        return new Response(backendRes.body, {
          headers: backendRes.headers,
          status: backendRes.status,
        });
      },
    },
  },
});
