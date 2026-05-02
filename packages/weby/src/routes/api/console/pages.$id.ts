import { createFileRoute } from "@tanstack/react-router";
import { deleteConsolePage, getConsolePage, updateConsolePage } from "../../../server/backy";
import type { UpdatePageInput } from "#/types";

export const Route = createFileRoute("/api/console/pages/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await deleteConsolePage(params.id, cookieHeader);
        return Response.json(result);
      },
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const page = await getConsolePage(params.id, cookieHeader);
        if (!page) {
          return Response.json({ error: "Page not found" }, { status: 404 });
        }
        return Response.json(page);
      },
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as UpdatePageInput;
        const page = await updateConsolePage(params.id, body, cookieHeader);
        return Response.json(page);
      },
    },
  },
});
