import { createFileRoute } from "@tanstack/react-router";
import { getAuthMe, BackyError } from "../../../server/backy";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        try {
          return Response.json(await getAuthMe(cookieHeader));
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json(null, { status: error.status });
          }
          throw error;
        }
      },
    },
  },
});
