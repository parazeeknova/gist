import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/use-theme";
import { AuthGate } from "../components/auth-gate";
import { ConsoleLayout } from "../components/console/console-layout";

const Console = function Console() {
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

export const Route = createFileRoute("/home")({
  component: Console,
  head: () => ({
    links: [{ href: "/home", rel: "canonical" }],
    meta: [
      { title: "verso — console" },
      { content: "noindex, nofollow", name: "robots" },
      { content: "verso — console", property: "og:title" },
      { content: "website", property: "og:type" },
    ],
  }),
});
