import { createFileRoute } from "@tanstack/react-router";
import { updateUserActive } from "#/server/backy";

export const Route = createFileRoute("/api/console/users/$id/active")({
  server: {
    handlers: {
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const result = await updateUserActive(params.id, body.is_active, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
