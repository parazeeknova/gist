import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "@/shared/hooks/use-theme";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { ConsoleLayout } from "@/features/console/components/console-layout";

const SpaceConsole = function SpaceConsole() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = isDarkMode ? "#111111" : "#eeeeee";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.backgroundColor = "";
      }
    };
  }, [isDarkMode]);

  return (
    <AuthGate>
      <ConsoleLayout />
    </AuthGate>
  );
};

export const Route = createFileRoute("/s/$spaceSlug")({
  component: SpaceConsole,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
