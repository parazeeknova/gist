import { createFileRoute } from "@tanstack/react-router";
import { getBootstrapState } from "../../../server/backy";

export const Route = createFileRoute("/api/auth/bootstrap-state")({
  server: {
    handlers: {
      GET: async () => {
        const state = await getBootstrapState();
        return Response.json(state ?? { bootstrapped: false });
      },
    },
  },
});
