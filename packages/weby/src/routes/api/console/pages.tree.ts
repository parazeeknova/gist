import { createFileRoute } from "@tanstack/react-router";
import { getPageTree } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/tree")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const tree = await getPageTree(cookieHeader);
        return Response.json(tree ?? []);
      },
    },
  },
});
