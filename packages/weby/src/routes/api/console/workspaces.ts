import { createFileRoute } from "@tanstack/react-router";
import { getWorkspaces, createWorkspace } from "../../../server/backy";

export const Route = createFileRoute("/api/console/workspaces")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const workspaces = await getWorkspaces(cookieHeader);
        return Response.json(workspaces ?? []);
      },
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const workspace = await createWorkspace(body, cookieHeader);
        return Response.json(workspace, { status: 201 });
      },
    },
  },
});
