import { createFileRoute } from "@tanstack/react-router";
import { getPageBySpaceAndSlug, BackyError } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$spaceId/pages/by-slug/$slugId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const page = await getPageBySpaceAndSlug(params.spaceId, params.slugId, cookieHeader);
          if (!page) {
            return Response.json({ error: "Page not found" }, { status: 404 });
          }
          return Response.json(page);
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json({ error: error.message }, { status: error.status });
          }
          throw error;
        }
      },
    },
  },
});
