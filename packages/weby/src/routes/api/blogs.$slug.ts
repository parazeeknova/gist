import { createFileRoute } from "@tanstack/react-router";
import { getBlogPost } from "../../server/backy";

export const Route = createFileRoute("/api/blogs/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const post = await getBlogPost(params.slug);
        if (!post) {
          return Response.json({ error: "Blog post not found" }, { status: 404 });
        }
        return Response.json(post);
      },
    },
  },
});
