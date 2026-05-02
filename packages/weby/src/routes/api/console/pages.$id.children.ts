import { createFileRoute } from "@tanstack/react-router";
import { getPageChildren } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/$id/children")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const children = await getPageChildren(params.id, cookieHeader);
        return Response.json(children ?? []);
      },
    },
  },
});
