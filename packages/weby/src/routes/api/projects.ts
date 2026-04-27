import { createFileRoute } from "@tanstack/react-router";
import { getProjects } from "../../server/backy";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async () => {
        const projects = await getProjects();
        return Response.json(projects);
      },
    },
  },
});
