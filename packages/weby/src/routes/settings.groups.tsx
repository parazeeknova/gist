import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "../hooks/use-theme";
import { GroupsSettings } from "../components/settings/groups/groups-settings";

const SettingsGroupsRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div className={`min-h-full ${t("text-text-dark", "text-text-light")}`}>
      <GroupsSettings />
    </div>
  );
};

export const Route = createFileRoute("/settings/groups")({
  component: SettingsGroupsRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
