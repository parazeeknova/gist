import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { WorkspaceSettings } from "@/features/settings/components/workspace/workspace-settings";

const SettingsWorkspaceRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  // eslint-disable-next-line no-use-before-define
  const search = Route.useSearch();

  return (
    <div className={`min-h-full ${t("text-text-dark", "text-text-light")}`}>
      <WorkspaceSettings urlWorkspaceName={search.name} />
    </div>
  );
};

export const Route = createFileRoute("/settings/workspace")({
  component: SettingsWorkspaceRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
});
