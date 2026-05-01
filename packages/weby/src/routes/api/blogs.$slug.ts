import { createFileRoute } from "@tanstack/react-router";
import { getBlogPost, BackyError } from "../../server/backy";

export const Route = createFileRoute("/api/blogs/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          return Response.json(await getBlogPost(params.slug));
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json({ error: "Blog post not found" }, { status: error.status });
          }
          throw error;
        }
      },
    },
  },
});
