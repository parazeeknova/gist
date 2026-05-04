import { createFileRoute } from "@tanstack/react-router";
import { publishConsolePage } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/$id/publish")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await publishConsolePage(params.id, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
