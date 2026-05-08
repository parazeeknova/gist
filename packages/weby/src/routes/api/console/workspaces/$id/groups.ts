import { createFileRoute } from "@tanstack/react-router";
import { getGroups, createGroup } from "#/server/backy";

interface GroupPayload {
  description?: string;
  name: string;
}

export const Route = createFileRoute("/api/console/workspaces/$id/groups")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const groups = await getGroups(params.id, cookieHeader);
        return Response.json(groups ?? { groups: [] });
      },
      POST: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as GroupPayload;
        const group = await createGroup(params.id, body, cookieHeader);
        return Response.json(group, { status: 201 });
      },
    },
  },
});
