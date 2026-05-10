import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/pages/favorites")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await getBacky(`console/pages/favorites`, cookieHeader);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return Response.json(
            { error: text || "failed to fetch favorites" },
            { status: res.status },
          );
        }
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          data = [];
        }
        return Response.json(data, { status: res.status });
      },
    },
  },
});
