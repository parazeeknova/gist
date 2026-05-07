/* eslint-disable unicorn/filename-case */
import { createFileRoute } from "@tanstack/react-router";
import { deleteBackyWithCookies, postBackyWithCookies, putBackyWithCookies } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$id/groups/$group-id")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = await deleteBackyWithCookies(
          `console/spaces/${params.id}/groups/${params["group-id"]}`,
          cookieHeader,
        );
        return Response.json(await res.json().catch(() => ({ status: "removed" })), {
          status: res.status,
        });
      },
      POST: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const res = await postBackyWithCookies(
          `console/spaces/${params.id}/groups/${params["group-id"]}`,
          body,
          cookieHeader,
        );
        return Response.json(await res.json().catch(() => ({ status: "added" })), {
          status: res.status,
        });
      },
      PUT: async ({ request, params }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const res = await putBackyWithCookies(
          `console/spaces/${params.id}/groups/${params["group-id"]}`,
          body,
          cookieHeader,
        );
        return Response.json(await res.json().catch(() => ({ status: "updated" })), {
          status: res.status,
        });
      },
    },
  },
});
