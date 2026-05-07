import { createFileRoute } from "@tanstack/react-router";
import { deleteDebugTableRows } from "#/server/backy";

export const Route = createFileRoute("/api/console/debug/tables/$tableName/rows")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as { ids: string[] };
        const result = await deleteDebugTableRows(params.tableName, body.ids, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
