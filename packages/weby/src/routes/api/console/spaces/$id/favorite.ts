import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/console/spaces/$id/favorite")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const backendOrigin =
          process.env.BACKY_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:7000";
        const res = await fetch(`${backendOrigin}/api/console/spaces/${params.id}/favorite`, {
          headers: { Cookie: cookieHeader },
          method: "POST",
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
