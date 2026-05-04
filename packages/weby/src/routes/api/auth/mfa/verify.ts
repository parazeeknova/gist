import { createFileRoute } from "@tanstack/react-router";
import { postBackyWithCookies } from "../../../../server/backy";

export const Route = createFileRoute("/api/auth/mfa/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const cookieHeader = request.headers.get("cookie");
        const backyRes = await postBackyWithCookies("auth/mfa/verify", body, cookieHeader);
        const data = await backyRes.text().catch(() => '{"error":"mfa verification failed"}');
        const responseHeaders = new Headers({ "Content-Type": "application/json" });
        for (const cookie of backyRes.headers.getSetCookie()) {
          responseHeaders.append("set-cookie", cookie);
        }
        return new Response(data, {
          headers: responseHeaders,
          status: backyRes.status,
        });
      },
    },
  },
});
