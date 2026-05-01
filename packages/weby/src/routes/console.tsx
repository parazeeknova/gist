import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { ConsoleLayout } from "../components/console/console-layout";

const Console = function Console() {
  const { data: user, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !user) {
      void navigate({ replace: true, to: "/" });
    }
  }, [isPending, user, navigate]);

  if (isPending || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-dark">
        <p className="text-sm text-text-dark/40">
          {isPending ? "checking authentication..." : "redirecting..."}
        </p>
      </div>
    );
  }

  return <ConsoleLayout />;
};

export const Route = createFileRoute("/console")({
  component: Console,
});
