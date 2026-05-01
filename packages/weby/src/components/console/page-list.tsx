import type { ConsolePage } from "#/types";
import { useQuery } from "@tanstack/react-query";
import { fetchProtected } from "../../hooks/fetch-protected";
import { useTheme } from "../../hooks/use-theme";

interface PageListProps {
  onSelectPage: (id: string) => void;
  selectedPageId: string | null;
  activeTab: "spaces" | "public" | "profile";
}

const useConsolePages = () =>
  useQuery<ConsolePage[]>({
    queryFn: ({ signal }) => fetchProtected<ConsolePage[]>("/api/console/pages", { signal }),
    queryKey: ["consolePages"],
    staleTime: 30 * 1000,
  });

export const PageList = ({ onSelectPage, selectedPageId, activeTab }: PageListProps) => {
  const { data: pages, isPending, isError } = useConsolePages();
  const { isDarkMode } = useTheme();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const emptyMessages: Record<string, string> = {
    profile: "shh, privacy",
    public: "nothing's public yet",
    spaces: "no spaces yet",
  };

  if (isPending) {
    return (
      <p
        className={`flex-1 flex items-center justify-center text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}
      >
        loading pages...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="flex-1 flex items-center justify-center text-[13px] text-red-400">
        failed to load pages
      </p>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <p
        className={`flex-1 flex items-center justify-center text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}
      >
        {emptyMessages[activeTab]}
      </p>
    );
  }

  if (isError) {
    return <p className="text-[13px] text-red-400">failed to load pages</p>;
  }

  if (!pages || pages.length === 0) {
    return (
      <p className={`text-[13px] ${t("text-text-dark/40", "text-text-light/40")}`}>
        {emptyMessages[activeTab]}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {pages.map((page) => {
        const isSelected = selectedPageId === page.id;
        return (
          <li key={page.id}>
            <button
              aria-current={isSelected ? "page" : undefined}
              className={`w-full px-2 py-1.5 text-left text-[13px] lowercase transition-colors ${
                isSelected
                  ? t("bg-white/10 text-text-dark", "bg-black/10 text-text-light")
                  : t(
                      "text-text-dark/60 hover:bg-white/5 hover:text-text-dark/80",
                      "text-text-light/60 hover:bg-black/5 hover:text-text-light/80",
                    )
              }`}
              onClick={() => onSelectPage(page.id)}
              type="button"
            >
              <span className="mr-2">{page.icon}</span>
              {page.title}
              {!page.isPublished && (
                <span
                  className={`ml-2 text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}
                >
                  draft
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
