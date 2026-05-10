import { createFileRoute } from "@tanstack/react-router";
import { postBackyWithCookies } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$id/favorite")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await postBackyWithCookies(
          `console/spaces/${params.id}/favorite`,
          {},
          cookieHeader,
        );
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return Response.json(
            { error: text || "failed to toggle favorite" },
            { status: res.status },
          );
        }
        const data = await res.json();
        return Response.json(data);
      },
    },
  },
});
