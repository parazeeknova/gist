import { createFileRoute } from "@tanstack/react-router";
import { createSpace, getSpaces } from "#/server/backy";

interface SpacePayload {
  description?: string;
  icon?: string;
  name: string;
  slug: string;
}

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
        const body = (await request.json()) as SpacePayload;
        const space = await createSpace(body, cookieHeader);
        return Response.json(space, { status: 201 });
      },
    },
  },
});
