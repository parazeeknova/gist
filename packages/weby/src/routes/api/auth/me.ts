import { createFileRoute } from "@tanstack/react-router";
import { getAuthMe } from "../../../server/backy";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        const user = await getAuthMe(cookieHeader);
        if (!user) {
          return Response.json(null, { status: 401 });
        }
        return Response.json(user);
      },
    },
  },
});
