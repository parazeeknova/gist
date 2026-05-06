import { createFileRoute } from "@tanstack/react-router";
import { BackyError, getUnreadNotificationCount } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications/unread-count")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ count: 0 });
        }
        try {
          const data = await getUnreadNotificationCount(cookieHeader);
          return Response.json(data);
        } catch (error) {
          if (error instanceof BackyError && error.status === 401) {
            return Response.json({ count: 0 });
          }
          throw error;
        }
      },
    },
  },
});
