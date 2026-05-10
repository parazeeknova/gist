import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/pages/$id/favorited")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await getBacky(`console/pages/${params.id}/favorited`, cookieHeader);
        if (!res.ok) {
          return Response.json({ favorited: false }, { status: res.status });
        }
        let data: { favorited: boolean };
        try {
          data = await res.json();
        } catch {
          data = { favorited: false };
        }
        return Response.json(data);
      },
    },
  },
});
