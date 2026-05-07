import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/use-theme";
import { AuthGate } from "../components/auth-gate";
import { ConsoleLayout } from "../components/console/console-layout";

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
