import { createFileRoute } from "@tanstack/react-router";
import { getSpaceMembers } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$id/members")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const members = await getSpaceMembers(params.id, cookieHeader);
        return Response.json(members ?? []);
      },
    },
  },
});
