import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/favorites")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await getBacky(`console/spaces/favorites`, cookieHeader);
        const data = await res.json();
        return Response.json(data, { status: res.status });
      },
    },
  },
});
