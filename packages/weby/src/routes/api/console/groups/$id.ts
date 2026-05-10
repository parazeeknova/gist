import { createFileRoute } from "@tanstack/react-router";
import { updateGroup, deleteGroup } from "#/server/backy";

interface GroupPayload {
  description?: string;
  name?: string;
}

const validateGroupPayload = (body: unknown): body is GroupPayload => {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const b = body as Partial<GroupPayload>;
  if (b.name !== undefined && (typeof b.name !== "string" || b.name.trim().length === 0)) {
    return false;
  }
  if (b.description !== undefined && typeof b.description !== "string") {
    return false;
  }
  return true;
};

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
        const raw = await request.json();
        if (!validateGroupPayload(raw)) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }
        const body: GroupPayload = raw;
        const group = await updateGroup(params.id, body, cookieHeader);
        return Response.json(group);
      },
    },
  },
});
