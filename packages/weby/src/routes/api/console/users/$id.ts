import { createFileRoute } from "@tanstack/react-router";
import { deleteUser, getUserById } from "#/server/backy";

export const Route = createFileRoute("/api/console/users/$id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await deleteUser(params.id, cookieHeader);
        return Response.json(result);
      },
      GET: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await getUserById(params.id, cookieHeader);
        if (!user) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }
        return Response.json(user);
      },
    },
  },
});
