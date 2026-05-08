import { createFileRoute } from "@tanstack/react-router";
import { getVapidPublicKey } from "#/server/backy";

export const Route = createFileRoute("/api/console/push/public-key")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const data = await getVapidPublicKey(cookieHeader);
        return Response.json(data);
      },
    },
  },
});
