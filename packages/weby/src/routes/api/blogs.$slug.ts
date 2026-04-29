import { createFileRoute } from "@tanstack/react-router";
import { getBlogPost } from "../../server/backy";

export const Route = createFileRoute("/api/blogs/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const post = await getBlogPost(params.slug);
        return Response.json(post);
      },
    },
  },
});
