import { createFileRoute } from "@tanstack/react-router";
import { getGitHubStats } from "../../../server/backy";

export const Route = createFileRoute("/api/github/stats")({
  server: {
    handlers: {
      GET: async () => {
        const stats = await getGitHubStats();
        if (!stats) {
          return Response.json({ error: "Backend unavailable" }, { status: 502 });
        }
        return Response.json(stats);
      },
    },
  },
});
