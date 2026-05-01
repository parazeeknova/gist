import { createFileRoute } from "@tanstack/react-router";
import { getConsolePage } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const page = await getConsolePage(params.id, cookieHeader);
        if (!page) {
          return Response.json({ error: "Page not found" }, { status: 404 });
        }
        return Response.json(page);
      },
    },
  },
});
