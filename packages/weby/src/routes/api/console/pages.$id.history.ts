import { createFileRoute } from "@tanstack/react-router";
import { getPageHistory } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/$id/history")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const history = await getPageHistory(params.id, cookieHeader);
        return Response.json(history ?? []);
      },
    },
  },
});
