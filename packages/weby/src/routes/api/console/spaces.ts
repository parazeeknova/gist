import { createFileRoute } from "@tanstack/react-router";
import { createSpace, getSpaces } from "#/server/backy";

interface SpacePayload {
  description?: string;
  icon?: string;
  name: string;
  slug: string;
}

const validateSpacePayload = (body: unknown): body is SpacePayload => {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const b = body as Partial<SpacePayload>;
  if (typeof b.name !== "string" || b.name.trim().length === 0) {
    return false;
  }
  if (typeof b.slug !== "string" || b.slug.trim().length === 0) {
    return false;
  }
  if (b.description !== undefined && typeof b.description !== "string") {
    return false;
  }
  if (b.icon !== undefined && typeof b.icon !== "string") {
    return false;
  }
  return true;
};

export const Route = createFileRoute("/api/console/spaces")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get("workspaceId");
        const spaces = await getSpaces(workspaceId, cookieHeader);
        return Response.json(spaces ?? []);
      },
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const raw = await request.json();
        if (!validateSpacePayload(raw)) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }
        const body: SpacePayload = raw;
        const space = await createSpace(body, cookieHeader);
        return Response.json(space, { status: 201 });
      },
    },
  },
});
