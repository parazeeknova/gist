import { createFileRoute } from "@tanstack/react-router";
import { createConsolePage, getConsolePages } from "../../../server/backy";
import type { CreatePageInput } from "#/types";

export const Route = createFileRoute("/api/console/pages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const pages = await getConsolePages(cookieHeader);
        return Response.json(pages ?? []);
      },
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as CreatePageInput;
        const page = await createConsolePage(body, cookieHeader);
        return Response.json(page, { status: 201 });
      },
    },
  },
});
