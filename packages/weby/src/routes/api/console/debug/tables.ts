import { createFileRoute } from "@tanstack/react-router";
import { getDebugStorageObjects, getDebugStorageOrphans, getDebugTables } from "#/server/backy";

export const Route = createFileRoute("/api/console/debug/tables")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const url = new URL(request.url);
        if (url.searchParams.get("scope") === "storage-orphans") {
          const report = await getDebugStorageOrphans(cookieHeader);
          return Response.json(report);
        }
        if (url.searchParams.get("scope") === "storage-objects") {
          const response = await getDebugStorageObjects(cookieHeader);
          return Response.json(response);
        }

        const response = await getDebugTables(cookieHeader);
        return Response.json(response.tables ?? []);
      },
    },
  },
});
