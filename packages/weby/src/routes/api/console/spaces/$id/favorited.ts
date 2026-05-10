import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$id/favorited")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await getBacky(`console/spaces/${params.id}/favorited`, cookieHeader);
        if (!res.ok) {
          return Response.json({ favorited: false }, { status: res.status });
        }
        const data = await res.json().catch(() => ({ favorited: false }));
        return Response.json(data);
      },
    },
  },
});
