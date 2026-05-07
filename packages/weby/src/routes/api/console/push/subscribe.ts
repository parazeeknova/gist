import { createFileRoute } from "@tanstack/react-router";
import { subscribePush } from "#/server/backy";

export const Route = createFileRoute("/api/console/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const result = await subscribePush(body, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
