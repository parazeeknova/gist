import { createFileRoute } from "@tanstack/react-router";
import { getProfile } from "../../server/backy";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async () => {
        const profile = await getProfile();
        return Response.json(profile);
      },
    },
  },
});
