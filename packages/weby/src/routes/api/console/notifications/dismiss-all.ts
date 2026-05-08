import { createFileRoute } from "@tanstack/react-router";
import { dismissAllNotifications } from "#/server/backy";

export const Route = createFileRoute("/api/console/notifications/dismiss-all")({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await dismissAllNotifications(cookieHeader);
        return Response.json(result);
      },
    },
  },
});
