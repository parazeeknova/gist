import { createFileRoute } from "@tanstack/react-router";
import { movePage } from "../../../server/backy";
import type { MovePageInput } from "#/types";

export const Route = createFileRoute("/api/console/pages/$id/move")({
  server: {
    handlers: {
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as MovePageInput;
        const result = await movePage(params.id, body, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
