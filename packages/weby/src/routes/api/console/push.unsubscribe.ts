import { createFileRoute } from "@tanstack/react-router";
import { unsubscribePush } from "#/server/backy";

export const Route = createFileRoute("/api/console/push/unsubscribe")({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as { endpoint: string };
        const result = await unsubscribePush(body.endpoint, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
