import { createFileRoute } from "@tanstack/react-router";
import { postBackyWithCookies } from "../../../server/backy";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        const backyRes = await postBackyWithCookies("auth/logout", {}, cookieHeader);
        const data = await backyRes.json().catch(() => ({ status: "ok" }));
        const responseHeaders = new Headers();
        for (const cookie of backyRes.headers.getSetCookie()) {
          responseHeaders.append("set-cookie", cookie);
        }
        return Response.json(data, { headers: responseHeaders, status: backyRes.status });
      },
    },
  },
});
