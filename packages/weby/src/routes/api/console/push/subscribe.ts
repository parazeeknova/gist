import { createFileRoute } from "@tanstack/react-router";
import { subscribePush } from "#/server/backy";
import type { PushSubscriptionPayload } from "#/shared/types";

export const Route = createFileRoute("/api/console/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as PushSubscriptionPayload;
        const result = await subscribePush(body, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
