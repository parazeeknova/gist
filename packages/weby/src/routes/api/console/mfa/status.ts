import { createFileRoute } from "@tanstack/react-router";
import { getBacky } from "#/server/backy";

export const Route = createFileRoute("/api/console/mfa/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        const backyRes = await getBacky("console/mfa/status", cookieHeader);
        const data = await backyRes.json().catch(() => ({ error: "failed to get mfa status" }));
        return Response.json(data, { status: backyRes.status });
      },
    },
  },
});
