import { createFileRoute } from "@tanstack/react-router";
import { BackyError, getNotifications } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json([]);
        }
        try {
          const notifs = await getNotifications(cookieHeader);
          return Response.json(notifs);
        } catch (error) {
          if (error instanceof BackyError && error.status === 401) {
            return Response.json([]);
          }
          throw error;
        }
      },
    },
  },
});
