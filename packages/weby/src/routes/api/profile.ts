import { createFileRoute } from "@tanstack/react-router";
import { getProfile, BackyError } from "../../server/backy";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await getProfile());
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
