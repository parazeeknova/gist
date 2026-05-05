import { createFileRoute } from "@tanstack/react-router";
import { getNotifications } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const notifs = await getNotifications(cookieHeader);
        return Response.json(notifs);
      },
    },
  },
});
