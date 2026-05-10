import { createFileRoute } from "@tanstack/react-router";
import { addSpaceMember, removeSpaceMember, updateSpaceMemberRole } from "#/server/backy";

type SpaceMemberRolePayload = {
  role: string;
};

function validateRole(role: unknown): role is string {
  return typeof role === "string" && role.trim().length > 0;
}

export const Route = createFileRoute("/api/console/spaces/$id/members/$userId")({
  server: {
    handlers: {
      DELETE: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const result = await removeSpaceMember(params.id, params.userId, cookieHeader);
        return Response.json(result);
      },
      POST: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as SpaceMemberRolePayload;
        if (!validateRole(body.role)) {
          return Response.json({ error: "Invalid or missing role" }, { status: 400 });
        }
        const result = await addSpaceMember(params.id, params.userId, body.role, cookieHeader);
        return Response.json(result);
      },
      PUT: async ({ params, request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = (await request.json()) as SpaceMemberRolePayload;
        if (!validateRole(body.role)) {
          return Response.json({ error: "Invalid or missing role" }, { status: 400 });
        }
        const result = await updateSpaceMemberRole(
          params.id,
          params.userId,
          body.role,
          cookieHeader,
        );
        return Response.json(result);
      },
    },
  },
});
