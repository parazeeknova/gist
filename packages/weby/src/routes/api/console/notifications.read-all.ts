import { createFileRoute } from "@tanstack/react-router";
import { markAllNotificationsRead } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications/read-all")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await markAllNotificationsRead(cookieHeader);
        return Response.json(result);
      },
    },
  },
});
