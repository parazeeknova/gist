import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/console/spaces/$id/favorited")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ favorited: false });
        }
        const backendOrigin =
          process.env.BACKY_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:7000";
        const res = await fetch(`${backendOrigin}/api/console/spaces/${params.id}/favorited`, {
          headers: { Cookie: cookieHeader },
        });
        const body = await res.text();
        return new Response(body, {
          headers: { "Content-Type": "application/json" },
          status: res.status,
        });
      },
    },
  },
});
