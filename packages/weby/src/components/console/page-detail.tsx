import type { ConsolePageDetail } from "#/types";
import { useQuery } from "@tanstack/react-query";
import { fetchProtected } from "../../hooks/fetch-protected";
import { useTheme } from "../../hooks/use-theme";

interface PageDetailProps {
  pageId: string;
}

const useConsolePage = (pageId: string) =>
  useQuery<ConsolePageDetail>({
    queryFn: ({ signal }) =>
      fetchProtected<ConsolePageDetail>(`/api/console/pages/${pageId}`, { signal }),
    queryKey: ["consolePage", pageId],
    staleTime: 30 * 1000,
  });

export const PageDetail = ({ pageId }: PageDetailProps) => {
  const { data: page, isPending, isError } = useConsolePage(pageId);
  const { isDarkMode } = useTheme();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (isPending) {
    return (
      <p className={`text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}>
        loading page...
      </p>
    );
  }

  if (isError) {
    return <p className="text-[13px] text-red-400">failed to load page</p>;
  }

  if (!page) {
    return (
      <p className={`text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}>
        page not found
      </p>
    );
  }

  return (
    <article className="mx-auto max-w-2xl">
      <header className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{page.icon}</span>
          <h2 className={`text-lg font-medium ${t("text-text-dark", "text-text-light")}`}>
            {page.title}
          </h2>
        </div>
        <div
          className={`flex items-center gap-4 text-[11px] ${t("text-text-dark/40", "text-text-light/40")}`}
        >
          <span>{page.isPublished ? "published" : "draft"}</span>
          <span>slug: {page.slugId}</span>
          <span>updated: {new Date(page.updatedAt).toISOString().slice(0, 10)}</span>
        </div>
        {page.coverPhoto && (
          <img
            alt={`Cover for ${page.title}`}
            className={`w-full rounded border object-cover ${t("border-border-dark", "border-border-light")}`}
            src={page.coverPhoto}
          />
        )}
      </header>
      <div className="max-w-none">
        <pre
          className={`whitespace-pre-wrap wrap-break-word rounded border p-4 text-[13px] ${t("border-border-dark bg-black/20 text-text-dark/70", "border-border-light bg-black/5 text-text-light/70")}`}
        >
          {page.textContent}
        </pre>
      </div>
    </article>
  );
};
