import { createFileRoute } from "@tanstack/react-router";
import { getUnreadNotificationCount } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications/unread-count")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const data = await getUnreadNotificationCount(cookieHeader);
        return Response.json(data);
      },
    },
  },
});
