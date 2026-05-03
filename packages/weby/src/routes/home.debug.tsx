import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { DebugTable } from "../components/console/debug-table";
import { useTheme } from "../hooks/use-theme";

const DebugRouteComponent = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  // eslint-disable-next-line no-use-before-define
  const search = Route.useSearch();
  const table = search.table ?? null;

  useEffect(() => {
    document.title = table ? `verso — ${table}` : "verso — debug";
    return () => {
      document.title = "verso — console";
    };
  }, [table]);

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
    table: typeof search.table === "string" ? search.table : undefined,
  }),
});
