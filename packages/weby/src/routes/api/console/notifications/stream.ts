import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/console/notifications/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const backendOrigin =
          process.env.BACKY_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:7000";
        const backendUrl = `${backendOrigin}/api/console/notifications/stream`;

        const backendRes = await fetch(backendUrl, {
          headers: {
            Accept: "text/event-stream",
            Cookie: request.headers.get("cookie") ?? "",
          },
          signal: request.signal,
        });

        return new Response(backendRes.body, {
          headers: {
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Content-Type": backendRes.headers.get("Content-Type") ?? "text/event-stream",
            "X-Accel-Buffering": "no",
          },
          status: backendRes.status,
        });
      },
    },
  },
});
