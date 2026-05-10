import { createFileRoute } from "@tanstack/react-router";
import { getGroups, createGroup } from "#/server/backy";

interface GroupPayload {
  description?: string;
  name: string;
}

const validateGroupPayload = (body: unknown): body is GroupPayload => {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const b = body as Partial<GroupPayload>;
  if (typeof b.name !== "string" || b.name.trim().length === 0) {
    return false;
  }
  if (b.description !== undefined && typeof b.description !== "string") {
    return false;
  }
  return true;
};

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
        const raw = await request.json();
        if (!validateGroupPayload(raw)) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }
        const body: GroupPayload = raw;
        const group = await createGroup(params.id, body, cookieHeader);
        return Response.json(group, { status: 201 });
      },
    },
  },
});
