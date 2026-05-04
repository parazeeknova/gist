import type { PageHistoryItem } from "#/types";
import { useTheme } from "#/hooks/use-theme";
import { usePageHistory, useRestorePage } from "#/hooks/use-console-mutations";

interface PageHistoryProps {
  pageId: string;
}

const HistoryEntry = ({
  entry,
  pageId,
  onRestored,
}: {
  entry: PageHistoryItem;
  pageId: string;
  onRestored: () => void;
}) => {
  const { isDarkMode } = useTheme();
  const restorePage = useRestorePage();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const operationColors: Record<string, string> = {
    create: t("text-green-400", "text-green-700"),
    delete: t("text-red-400", "text-red-600"),
    move: t("text-purple-400", "text-purple-700"),
    publish: t("text-green-400", "text-green-700"),
    restore: t("text-amber-400", "text-amber-700"),
    unpublish: t("text-yellow-400", "text-yellow-700"),
    update: t("text-blue-400", "text-blue-700"),
  };

  return (
    <div
      className={`rounded border p-2.5 space-y-1.5 ${t(
        "border-border-dark",
        "border-border-light",
      )}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={
              operationColors[entry.operation] ?? t("text-text-dark/60", "text-text-light/60")
            }
          >
            {entry.operation}
          </span>
          <span className={t("text-text-dark/30", "text-text-light/30")}>
            {new Date(entry.createdAt).toLocaleString()}
          </span>
        </div>
        <button
          className={`text-[11px] rounded px-2 py-0.5 transition-colors ${t(
            "text-text-dark/40 hover:text-text-dark hover:bg-white/10",
            "text-text-light/40 hover:text-text-light hover:bg-black/10",
          )}`}
          disabled={restorePage.isPending}
          onClick={() => {
            if (
              // eslint-disable-next-line no-alert
              confirm(
                `Restore to "${entry.title}" from ${new Date(entry.createdAt).toLocaleString()}?`,
              )
            ) {
              restorePage.mutate(
                { id: pageId, input: { historyId: entry.id } },
                { onSuccess: onRestored },
              );
            }
          }}
          type="button"
        >
          {restorePage.isPending ? "restoring..." : "restore"}
        </button>
      </div>
      <p className={`text-[12px] truncate ${t("text-text-dark/60", "text-text-light/60")}`}>
        {entry.title}
      </p>
      <p className={`text-[11px] line-clamp-2 ${t("text-text-dark/30", "text-text-light/30")}`}>
        {entry.textContent?.slice(0, 200)}
      </p>
    </div>
  );
};

export const PageHistory = ({ pageId }: PageHistoryProps) => {
  const { data: history, isPending, isError } = usePageHistory(pageId);
  const { isDarkMode } = useTheme();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (isPending) {
    return (
      <p className={`text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}>
        loading history...
      </p>
    );
  }

  if (isError) {
    return <p className="text-[13px] text-red-400">failed to load history</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 space-y-3">
      <h3 className={`text-sm font-medium ${t("text-text-dark", "text-text-light")}`}>
        page history
      </h3>
      {!history || history.length === 0 ? (
        <p className={`text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}>
          no history entries yet
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <HistoryEntry
              entry={entry}
              key={entry.id}
              pageId={pageId}
              onRestored={() => {
                // Invalidate will be handled by the mutation hook
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
