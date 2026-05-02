import { createFileRoute } from "@tanstack/react-router";
import { restorePage } from "../../../server/backy";
import type { RestorePageInput } from "#/types";

export const Route = createFileRoute("/api/console/pages/$id/restore")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as RestorePageInput;
        const page = await restorePage(params.id, body, cookieHeader);
        return Response.json(page);
      },
    },
  },
});
