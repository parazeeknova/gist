import { createFileRoute } from "@tanstack/react-router";
import { deleteSpace, updateSpace } from "#/server/backy";

interface SpacePayload {
  description?: string;
  headerImage?: string;
  icon?: string;
  name: string;
  slug: string;
}

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
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as SpacePayload;
        const space = await updateSpace(params.id, body, cookieHeader);
        return Response.json(space);
      },
    },
  },
});
