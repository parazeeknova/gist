import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/console/unsplash/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const url = new URL(request.url);
        const q = url.searchParams.get("q") ?? "";
        const page = url.searchParams.get("page") ?? "1";
        const perPage = url.searchParams.get("per_page") ?? "20";

        const backendOrigin =
          process.env.BACKY_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:7000";
        const backendUrl = `${backendOrigin}/api/console/unsplash/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`;

        const backendRes = await fetch(backendUrl, {
          headers: { Cookie: cookieHeader },
        });

        const body = await backendRes.text();
        return new Response(body, {
          headers: { "Content-Type": backendRes.headers.get("Content-Type") ?? "application/json" },
          status: backendRes.status,
        });
      },
    },
  },
});
