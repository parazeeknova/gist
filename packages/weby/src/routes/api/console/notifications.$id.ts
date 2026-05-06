import { createFileRoute } from "@tanstack/react-router";
import { dismissNotification } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await dismissNotification(params.id, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
