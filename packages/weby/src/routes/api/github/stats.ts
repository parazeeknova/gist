import { createFileRoute } from "@tanstack/react-router";
import { getGitHubStats } from "../../../server/backy";

export const Route = createFileRoute("/api/github/stats")({
  server: {
    handlers: {
      GET: async () => {
        const stats = await getGitHubStats();
        return Response.json(stats);
      },
    },
  },
});
