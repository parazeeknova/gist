import { createFileRoute } from "@tanstack/react-router";
import { getGroupMembers, addGroupMember } from "#/server/backy";

export const Route = createFileRoute("/api/console/groups/$id/members")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const members = await getGroupMembers(params.id, cookieHeader);
        return Response.json(members ?? { members: [] });
      },
      POST: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as { userId?: string };
        if (!body.userId) {
          return Response.json({ error: "userId required" }, { status: 400 });
        }
        const result = await addGroupMember(params.id, body.userId, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
