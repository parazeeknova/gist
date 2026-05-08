import { createFileRoute } from "@tanstack/react-router";
import { updateGroup, deleteGroup } from "#/server/backy";

interface GroupPayload {
  description?: string;
  name?: string;
}

export const Route = createFileRoute("/api/console/groups/$id")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await deleteGroup(params.id, cookieHeader);
        return Response.json(result);
      },
      PUT: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as GroupPayload;
        const group = await updateGroup(params.id, body, cookieHeader);
        return Response.json(group);
      },
    },
  },
});
