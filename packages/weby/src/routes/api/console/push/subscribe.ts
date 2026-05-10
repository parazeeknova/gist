import { createFileRoute } from "@tanstack/react-router";
import { subscribePush } from "#/server/backy";
import type { PushSubscriptionPayload } from "#/shared/types";

interface RawPushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const validatePushPayload = (body: unknown): body is RawPushSubscriptionPayload => {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const b = body as Partial<RawPushSubscriptionPayload>;
  if (typeof b.endpoint !== "string" || !b.endpoint) {
    return false;
  }
  if (typeof b.keys !== "object" || b.keys === null) {
    return false;
  }
  if (
    typeof (b.keys as { p256dh?: unknown }).p256dh !== "string" ||
    !(b.keys as { p256dh?: unknown }).p256dh
  ) {
    return false;
  }
  if (
    typeof (b.keys as { auth?: unknown }).auth !== "string" ||
    !(b.keys as { auth?: unknown }).auth
  ) {
    return false;
  }
  return true;
};

export const Route = createFileRoute("/api/console/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const raw = await request.json();
        if (!validatePushPayload(raw)) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }
        const payload: PushSubscriptionPayload = {
          auth: raw.keys.auth,
          endpoint: raw.endpoint,
          p256dh: raw.keys.p256dh,
        };
        const result = await subscribePush(payload, cookieHeader);
        return Response.json(result);
      },
    },
  },
});
