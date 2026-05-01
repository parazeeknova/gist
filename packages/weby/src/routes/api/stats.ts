import { getStats } from "#/server/backy";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        const stats = await getStats();
        return Response.json(stats ?? { pages: 0, posts: 0 });
      },
    },
  },
});
