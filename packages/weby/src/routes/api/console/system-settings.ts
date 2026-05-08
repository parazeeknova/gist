import { createFileRoute } from "@tanstack/react-router";
import { BackyError, getSystemSettings, updateSystemSetting } from "#/server/backy";

export const Route = createFileRoute("/api/console/system-settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const response = await getSystemSettings(cookieHeader);
          return Response.json(response);
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json(
              { error: "failed to get system settings" },
              { status: error.status },
            );
          }
          throw error;
        }
      },
      PATCH: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const body = (await request.json()) as { key: string; value: boolean };
          const result = await updateSystemSetting(body.key, body.value, cookieHeader);
          return Response.json(result);
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json(
              { error: "failed to update system setting" },
              { status: error.status },
            );
          }
          throw error;
        }
      },
    },
  },
});
