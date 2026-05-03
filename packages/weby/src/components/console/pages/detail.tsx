import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTheme } from "#/hooks/use-theme";
import {
  useConsolePage,
  useDeletePage,
  usePublishPage,
  useUnpublishPage,
} from "#/hooks/use-console-mutations";
import { PageEditor } from "./editor";
import { PageHistory } from "./history";

interface PageDetailProps {
  pageId: string;
  onDeleted?: () => void;
}

export const PageDetail = ({ pageId, onDeleted }: PageDetailProps) => {
  const { data: page, isPending, isError } = useConsolePage(pageId);
  const deletePage = useDeletePage();
  const publishPage = usePublishPage();
  const unpublishPage = useUnpublishPage();
  const { isDarkMode } = useTheme();
  const [showHistory, setShowHistory] = useState(false);

  const themeClass = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (isPending) {
    return (
      <p className={`text-[13px] ${themeClass("text-text-dark/40", "text-text-light/40")}`}>
        loading page...
      </p>
    );
  }

  if (isError) {
    return <p className="text-[13px] text-red-400">failed to load page</p>;
  }

  if (!page) {
    return (
      <p className={`text-[13px] ${themeClass("text-text-dark/40", "text-text-light/40")}`}>
        page not found
      </p>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px]">
          <span
            className={`rounded px-2 py-0.5 ${
              page.isPublished
                ? themeClass("bg-green-500/20 text-green-400", "bg-green-500/10 text-green-700")
                : themeClass("bg-yellow-500/20 text-yellow-400", "bg-yellow-500/10 text-yellow-700")
            }`}
          >
            {page.isPublished ? "published" : "draft"}
          </span>
          <span className={themeClass("text-text-dark/40", "text-text-light/40")}>
            /{page.slugId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`text-[11px] rounded px-2 py-1 transition-colors ${themeClass(
              "text-text-dark/50 hover:text-text-dark hover:bg-white/10",
              "text-text-light/50 hover:text-text-light hover:bg-black/10",
            )}`}
            onClick={() => setShowHistory((prev) => !prev)}
            type="button"
            title="Page history"
          >
            <ClockCounterClockwiseIcon size={12} />
          </button>
          {page.isPublished ? (
            <button
              className={`text-[11px] rounded px-2 py-1 transition-colors ${themeClass(
                "text-text-dark/50 hover:text-text-dark hover:bg-white/10",
                "text-text-light/50 hover:text-text-light hover:bg-black/10",
              )}`}
              disabled={unpublishPage.isPending}
              onClick={() => unpublishPage.mutate(page.id)}
              type="button"
            >
              unpublish
            </button>
          ) : (
            <button
              className={`text-[11px] rounded px-2 py-1 transition-colors ${themeClass(
                "text-text-dark/50 hover:text-green-400 hover:bg-white/10",
                "text-text-light/50 hover:text-green-700 hover:bg-black/10",
              )}`}
              disabled={publishPage.isPending}
              onClick={() => publishPage.mutate(page.id)}
              type="button"
            >
              publish
            </button>
          )}
          <button
            className={`text-[11px] rounded px-2 py-1 transition-colors ${themeClass(
              "text-text-dark/50 hover:text-red-400 hover:bg-white/10",
              "text-text-light/50 hover:text-red-600 hover:bg-black/10",
            )}`}
            disabled={deletePage.isPending}
            onClick={() => {
              // eslint-disable-next-line no-alert
              if (confirm(`Delete "${page.title}" and all its children? This cannot be undone.`)) {
                deletePage.mutate(page.id, {
                  onSuccess: () => onDeleted?.(),
                });
              }
            }}
            type="button"
          >
            delete
          </button>
        </div>
      </div>

      {showHistory ? <PageHistory pageId={page.id} /> : <PageEditor page={page} />}
    </div>
  );
};
