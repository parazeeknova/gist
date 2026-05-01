import { createFileRoute } from "@tanstack/react-router";
import { getConsolePages } from "../../../server/backy";

export const Route = createFileRoute("/api/console/pages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        const pages = await getConsolePages(cookieHeader);
        return Response.json(pages ?? []);
      },
    },
  },
});
