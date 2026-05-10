import { createFileRoute } from "@tanstack/react-router";
import { getPageTree } from "#/server/backy";

export const Route = createFileRoute("/api/console/pages/tree")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const url = new URL(request.url);
        const spaceId = url.searchParams.get("spaceId") ?? "";
        const tree = await getPageTree(spaceId, cookieHeader);
        return Response.json(tree ?? []);
      },
    },
  },
});
