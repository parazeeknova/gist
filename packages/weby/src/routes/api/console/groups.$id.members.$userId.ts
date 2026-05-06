import { createFileRoute } from "@tanstack/react-router";
import { removeGroupMember } from "#/server/backy";

export const Route = createFileRoute("/api/console/groups/$id/members/$userId")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await removeGroupMember(params.id, params.userId, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
