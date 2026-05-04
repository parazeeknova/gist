import { createFileRoute } from "@tanstack/react-router";
import { getUsers } from "#/server/backy";

export const Route = createFileRoute("/api/console/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const users = await getUsers(cookieHeader);
        return Response.json(users ?? []);
      },
    },
  },
});
