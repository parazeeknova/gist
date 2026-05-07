import { createFileRoute } from "@tanstack/react-router";
import { getSpaceBySlug } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/by-slug/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const space = await getSpaceBySlug(params.slug, cookieHeader);
        return Response.json(space);
      },
    },
  },
});
