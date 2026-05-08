import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import { SpacesSettings } from "#/features/settings/components/spaces/spaces-settings";

const SettingsSpacesRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  // eslint-disable-next-line no-use-before-define
  const search = Route.useSearch();

  useEffect(() => {
    document.title = "verso — spaces";
    return () => {
      document.title = "verso — console";
    };
  }, []);

  return (
    <div className={`min-h-full ${t("text-text-dark", "text-text-light")}`}>
      <SpacesSettings urlWorkspaceName={search.workspace} />
    </div>
  );
};

export const Route = createFileRoute("/settings/spaces")({
  component: SettingsSpacesRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    workspace: typeof search.workspace === "string" ? search.workspace : undefined,
  }),
});
