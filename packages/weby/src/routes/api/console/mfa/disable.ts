import { createFileRoute } from "@tanstack/react-router";
import { postBackyWithCookies } from "#/server/backy";

export const Route = createFileRoute("/api/console/mfa/disable")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const cookieHeader = request.headers.get("cookie");
        const backyRes = await postBackyWithCookies("console/mfa/disable", body, cookieHeader);
        const data = await backyRes.json().catch(() => ({ error: "failed to disable mfa" }));
        return Response.json(data, { status: backyRes.status });
      },
    },
  },
});
