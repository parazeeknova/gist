import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/use-theme";
import { AuthGate } from "../components/auth-gate";
import { ConsoleLayout } from "../components/console/console-layout";

const Settings = function Settings() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  useEffect(() => {
    if (pathname === "/settings") {
      void navigate({ replace: true, to: "/settings/account/profile" });
    }
  }, [pathname, navigate]);

  return (
    <AuthGate>
      <ConsoleLayout />
    </AuthGate>
  );
};

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({
    links: [{ href: "/settings", rel: "canonical" }],
    meta: [
      { title: "verso — settings" },
      { content: "noindex, nofollow", name: "robots" },
      { content: "verso — settings", property: "og:title" },
      { content: "website", property: "og:type" },
    ],
  }),
});
