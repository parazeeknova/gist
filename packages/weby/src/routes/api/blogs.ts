import { createFileRoute } from "@tanstack/react-router";
import { getBlogManifest } from "../../server/backy";

export const Route = createFileRoute("/api/blogs")({
  server: {
    handlers: {
      GET: async () => {
        const manifest = await getBlogManifest();
        return Response.json(manifest ?? []);
      },
    },
  },
});
