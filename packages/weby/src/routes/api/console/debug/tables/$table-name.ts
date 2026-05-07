/* eslint-disable unicorn/filename-case */
import { createFileRoute } from "@tanstack/react-router";
import { getDebugTableData, deleteDebugTableData } from "#/server/backy";

export const Route = createFileRoute("/api/console/debug/tables/$table-name")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await deleteDebugTableData(params["table-name"], cookieHeader);
        return Response.json(result);
      },
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const data = await getDebugTableData(params["table-name"], cookieHeader);
        return Response.json(data);
      },
    },
  },
});
