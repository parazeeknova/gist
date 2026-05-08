import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import { DebugSettings } from "#/features/settings/components/debug/debug-settings";

const SettingsSystemsDebugRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  useEffect(() => {
    document.title = "verso — debug settings";
    return () => {
      document.title = "verso — console";
    };
  }, []);

  return (
    <div className={`min-h-full ${t("text-text-dark", "text-text-light")}`}>
      <DebugSettings />
    </div>
  );
};

export const Route = createFileRoute("/settings/systems/debug")({
  component: SettingsSystemsDebugRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
