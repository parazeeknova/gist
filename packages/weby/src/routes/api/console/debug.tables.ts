import { createFileRoute } from "@tanstack/react-router";
import { getDebugTables } from "../../../server/backy";

export const Route = createFileRoute("/api/console/debug/tables")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const tables = await getDebugTables(cookieHeader);
        return Response.json(tables ?? []);
      },
    },
  },
});
