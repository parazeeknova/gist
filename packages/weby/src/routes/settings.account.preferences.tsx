import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/use-theme";
import { PreferencesSettings } from "../components/settings/preferences/preferences-settings";

const SettingsPreferencesRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  useEffect(() => {
    document.title = "verso — preferences";
    return () => {
      document.title = "verso — console";
    };
  }, []);

  return (
    <div className={`min-h-full ${t("text-text-dark", "text-text-light")}`}>
      <PreferencesSettings />
    </div>
  );
};

export const Route = createFileRoute("/settings/account/preferences")({
  component: SettingsPreferencesRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
