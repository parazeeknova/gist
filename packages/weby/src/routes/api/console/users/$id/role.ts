import { createFileRoute } from "@tanstack/react-router";
import { updateUserRole } from "#/server/backy";

export const Route = createFileRoute("/api/console/users/$id/role")({
  server: {
    handlers: {
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const result = await updateUserRole(params.id, body.role, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
