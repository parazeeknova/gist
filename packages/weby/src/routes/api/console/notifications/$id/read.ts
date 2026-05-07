import { createFileRoute } from "@tanstack/react-router";
import { markNotificationRead } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications/$id/read")({
  server: {
    handlers: {
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await markNotificationRead(params.id, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
