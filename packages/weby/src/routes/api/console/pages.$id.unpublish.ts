import { createFileRoute } from "@tanstack/react-router";
import { unpublishConsolePage } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/$id/unpublish")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await unpublishConsolePage(params.id, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
