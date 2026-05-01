import { createFileRoute } from "@tanstack/react-router";
import { getExperience } from "../../server/backy";

export const Route = createFileRoute("/api/experience")({
  server: {
    handlers: {
      GET: async () => {
        const experience = await getExperience();
        return Response.json(experience ?? []);
      },
    },
  },
});
