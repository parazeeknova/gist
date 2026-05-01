import { createFileRoute } from "@tanstack/react-router";
import { getBootstrapState, BackyError } from "../../../server/backy";

export const Route = createFileRoute("/api/auth/bootstrap-state")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await getBootstrapState());
        } catch (error) {
          if (error instanceof BackyError) {
            return Response.json({ bootstrapped: false });
          }
          throw error;
        }
      },
    },
  },
});
