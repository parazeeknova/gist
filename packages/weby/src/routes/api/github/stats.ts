import { createFileRoute } from "@tanstack/react-router";
import { getGitHubStats, BackyError } from "../../../server/backy";

export const Route = createFileRoute("/api/github/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await getGitHubStats());
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json({ error: "Backend unavailable" }, { status: 502 });
          }
          throw error;
        }
      },
    },
  },
});
