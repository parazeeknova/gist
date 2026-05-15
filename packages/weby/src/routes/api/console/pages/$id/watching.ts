import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/pages/$id/watching")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await getBacky(`console/pages/${params.id}/watching`, cookieHeader);
        if (!res.ok) {
          return Response.json({ watching: false }, { status: res.status });
        }
        let data: { watching: boolean };
        try {
          data = await res.json();
        } catch {
          data = { watching: false };
        }
        return Response.json(data);
      },
    },
  },
});
