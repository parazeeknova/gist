import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/use-theme";
import { MembersSettings } from "../components/settings/members/members-settings";

const SettingsMembersRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  useEffect(() => {
    document.title = "verso — members";
    return () => {
      document.title = "verso — console";
    };
  }, []);

  return (
    <div className={`min-h-full ${t("text-text-dark", "text-text-light")}`}>
      <MembersSettings />
    </div>
  );
};

export const Route = createFileRoute("/settings/members")({
  component: SettingsMembersRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
