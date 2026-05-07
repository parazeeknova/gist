/* eslint-disable unicorn/filename-case */
import { createFileRoute } from "@tanstack/react-router";
import { addSpaceMember, removeSpaceMember, updateSpaceMemberRole } from "#/server/backy";

export const Route = createFileRoute("/api/console/spaces/$id/members/$user-id")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await removeSpaceMember(params.id, params["user-id"], cookieHeader);
        return Response.json(result);
      },
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const result = await addSpaceMember(params.id, params["user-id"], body.role, cookieHeader);
        return Response.json(result);
      },
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const result = await updateSpaceMemberRole(
          params.id,
          params["user-id"],
          body.role,
          cookieHeader,
        );
        return Response.json(result);
      },
    },
  },
});
