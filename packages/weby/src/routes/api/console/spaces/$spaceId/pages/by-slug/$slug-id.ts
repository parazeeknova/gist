import { createFileRoute } from "@tanstack/react-router";
import { getPageBySpaceAndSlug } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$spaceId/pages/by-slug/$slug-id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const page = await getPageBySpaceAndSlug(params.spaceId, params["slug-id"], cookieHeader);
        return Response.json(page);
      },
    },
  },
});
