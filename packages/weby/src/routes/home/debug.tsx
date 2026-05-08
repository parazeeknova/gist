import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDebugRoutesEnabled } from "#/features/console/hooks/use-system-settings";
import { DebugStorage } from "#/features/console/components/debug/storage";
import { DebugTable } from "#/features/console/components/debug/table";
import { useTheme } from "#/shared/hooks/use-theme";

type DebugTab = "database" | "storage";

const DebugRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const debugRoutesEnabled = useDebugRoutesEnabled();
  const navigate = useNavigate();
  // eslint-disable-next-line no-use-before-define
  const search = Route.useSearch();
  const tab = (search.tab ?? "database") as DebugTab;
  const table = search.table ?? null;

  useEffect(() => {
    if (!debugRoutesEnabled && debugRoutesEnabled !== null) {
      void navigate({ replace: true, to: "/settings/systems/debug" });
    }
  }, [debugRoutesEnabled, navigate]);

  if (!debugRoutesEnabled) {
    return (
      <div
        className={`flex items-center justify-center h-full text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
      >
        debug routes are disabled. enable them in
        <button
          className={`mx-1 underline ${t("text-text-dark/50 hover:text-text-dark/70", "text-text-light/50 hover:text-text-light/70")}`}
          onClick={() => navigate({ to: "/settings/systems/debug" })}
          type="button"
        >
          settings
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (tab === "storage") {
      document.title = "verso — storage";
      return () => {
        document.title = "verso — console";
      };
    }

    document.title = table ? `verso — ${table}` : "verso — debug";
    return () => {
      document.title = "verso — console";
    };
  }, [table, tab]);

  if (tab === "storage") {
    return <DebugStorage />;
  }

  if (table) {
    return <DebugTable key={table} tableName={table} />;
  }

  return (
    <div
      className={`flex items-center justify-center h-full text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
    >
      select a table from the sidebar
    </div>
  );
};

export const Route = createFileRoute("/home/debug")({
  component: DebugRouteComponent,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search.tab === "database" || search.tab === "storage" ? (search.tab as DebugTab) : undefined,
    table: typeof search.table === "string" ? search.table : undefined,
  }),
});
