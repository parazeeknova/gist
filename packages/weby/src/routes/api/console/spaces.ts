import { createFileRoute } from "@tanstack/react-router";
import { createSpace, getSpaces } from "../../../server/backy";

export const Route = createFileRoute("/api/console/spaces")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const spaces = await getSpaces(cookieHeader);
        return Response.json(spaces ?? []);
      },
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const space = await createSpace(body, cookieHeader);
        return Response.json(space, { status: 201 });
      },
    },
  },
});
