import { FileTextIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { fetchProtected } from "@/features/auth/hooks/fetch-protected";
import { useSpaceBySlug } from "@/features/console/hooks/use-spaces";
import type { ConsolePage } from "@/shared/types";

export const SpaceOverview = () => {
  const { spaceSlug } = useParams({ from: "/s/$spaceSlug" });
  const { data: space } = useSpaceBySlug(spaceSlug);
  const { isDarkMode } = useTheme();
  const { data: pages } = useQuery<ConsolePage[]>({
    queryFn: ({ signal }) => fetchProtected<ConsolePage[]>("/api/console/pages", { signal }),
    queryKey: ["consolePages"],
    staleTime: 30 * 1000,
  });

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const recentDocs = [...(pages ?? [])]
    .toSorted((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-12 min-h-full">
      <h1 className={`text-lg lowercase ${t("text-text-dark", "text-text-light")}`}>
        {space?.name || spaceSlug}
      </h1>
      {space?.description && (
        <p className={`mt-1 text-[12px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
          {space.description}
        </p>
      )}

      <div className={`mt-8 border-t pt-5 ${t("border-border-dark", "border-border-light")}`}>
        <div className="flex items-center justify-between">
          <p className={`text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
            recent pages
          </p>
        </div>

        {recentDocs.length === 0 ? (
          <p
            className={`mt-6 text-center text-[13px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            no pages yet
          </p>
        ) : (
          <div className="mt-3 space-y-0.5">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-3 rounded px-2 py-1.5 ${t("hover:bg-white/5", "hover:bg-black/3")}`}
              >
                <FileTextIcon className={t("text-text-dark/30", "text-text-light/30")} size={14} />
                <span
                  className={`min-w-0 flex-1 truncate text-[13px] lowercase ${t("text-text-dark/60", "text-text-light/60")}`}
                >
                  {doc.title}
                </span>
                <span
                  className={`shrink-0 text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}
                >
                  {new Date(doc.updatedAt).toISOString().slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
