import { createFileRoute } from "@tanstack/react-router";
import { postBackyWithCookies } from "#/server/backy";

export const Route = createFileRoute("/api/console/pages/$id/favorite")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await postBackyWithCookies(
          `console/pages/${params.id}/favorite`,
          {},
          cookieHeader,
        );
        const data = await res.json();
        return Response.json(data);
      },
    },
  },
});
