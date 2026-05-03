import { createFileRoute } from "@tanstack/react-router";
import { DebugTable } from "../components/console/debug-table";
import { useConsoleContext } from "../components/console/console-layout";
import { useTheme } from "../hooks/use-theme";

const DebugRoute = () => {
  const { isDarkMode } = useTheme();
  const { debugTable } = useConsoleContext();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (debugTable) {
    return <DebugTable tableName={debugTable} />;
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
  component: DebugRoute,
});
