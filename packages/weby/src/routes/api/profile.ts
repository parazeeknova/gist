import { createFileRoute } from "@tanstack/react-router";
import { getProfile } from "../../server/backy";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async () => {
        const profile = await getProfile();
        if (!profile) {
          return Response.json({ error: "Backend unavailable" }, { status: 502 });
        }
        return Response.json(profile);
      },
    },
  },
});
