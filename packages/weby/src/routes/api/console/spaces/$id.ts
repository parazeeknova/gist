import { createFileRoute } from "@tanstack/react-router";
import { deleteSpace, getSpaceById, updateSpace } from "#/server/backy";

interface SpacePayload {
  defaultRole?: string;
  description?: string;
  headerImage?: string;
  icon?: string;
  name: string;
  slug: string;
  visibility?: string;
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
  if (b.headerImage !== undefined && typeof b.headerImage !== "string") {
    return false;
  }
  if (b.visibility !== undefined && typeof b.visibility !== "string") {
    return false;
  }
  if (b.defaultRole !== undefined && typeof b.defaultRole !== "string") {
    return false;
  }
  return true;
};

export const Route = createFileRoute("/api/console/spaces/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await deleteSpace(params.id, cookieHeader);
        return Response.json(result);
      },
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const space = await getSpaceById(params.id, cookieHeader);
        if (!space) {
          return Response.json({ error: "Space not found" }, { status: 404 });
        }
        return Response.json(space);
      },
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const raw = await request.json();
        if (!validateSpacePayload(raw)) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }
        const body: SpacePayload = raw;
        const space = await updateSpace(params.id, body, cookieHeader);
        return Response.json(space);
      },
    },
  },
});
