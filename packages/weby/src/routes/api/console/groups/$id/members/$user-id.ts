/* eslint-disable unicorn/filename-case */
import { createFileRoute } from "@tanstack/react-router";
import { removeGroupMember } from "#/server/backy";

export const Route = createFileRoute("/api/console/groups/$id/members/$user-id")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await removeGroupMember(params.id, params["user-id"], cookieHeader);
        return Response.json(result);
      },
    },
  },
});
