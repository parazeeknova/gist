import { createFileRoute } from "@tanstack/react-router";
import { updateUserActive } from "#/server/backy";

interface UserActivePayload {
  is_active: boolean;
}

export const Route = createFileRoute("/api/console/users/$id/active")({
  server: {
    handlers: {
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as UserActivePayload;
        const result = await updateUserActive(params.id, body.is_active, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
