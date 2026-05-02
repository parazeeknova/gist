import { createFileRoute } from "@tanstack/react-router";
import { getPageHistoryEntry } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages/$id/history/$historyId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const entry = await getPageHistoryEntry(params.id, params.historyId, cookieHeader);
        if (!entry) {
          return Response.json({ error: "History entry not found" }, { status: 404 });
        }
        return Response.json(entry);
      },
    },
  },
});
