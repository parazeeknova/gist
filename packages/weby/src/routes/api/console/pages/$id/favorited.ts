import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/pages/$id/favorited")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ favorited: false });
        }
        const res = await getBacky(`console/pages/${params.id}/favorited`, cookieHeader);
        const data = await res.json();
        return Response.json(data ?? { favorited: false });
      },
    },
  },
});
