import type { ConsolePage } from "#/types";
import { useQuery } from "@tanstack/react-query";
import { fetchProtected } from "../../hooks/fetch-protected";

interface PageListProps {
  onSelectPage: (id: string) => void;
  selectedPageId: string | null;
}

const useConsolePages = () =>
  useQuery<ConsolePage[]>({
    queryFn: ({ signal }) => fetchProtected<ConsolePage[]>("/api/console/pages", { signal }),
    queryKey: ["consolePages"],
    staleTime: 30 * 1000,
  });

export const PageList = ({ onSelectPage, selectedPageId }: PageListProps) => {
  const { data: pages, isPending, isError } = useConsolePages();

  if (isPending) {
    return <p className="text-[13px] text-text-dark/40">loading pages...</p>;
  }

  if (isError) {
    return <p className="text-[13px] text-red-400">failed to load pages</p>;
  }

  if (!pages || pages.length === 0) {
    return <p className="text-[13px] text-text-dark/40">no pages found</p>;
  }

  return (
    <ul className="space-y-0.5">
      {pages.map((page) => {
        const isSelected = selectedPageId === page.id;
        return (
          <li key={page.id}>
            <button
              className={`w-full px-2 py-1.5 text-left text-[13px] lowercase transition-colors ${
                isSelected
                  ? "bg-white/10 text-text-dark"
                  : "text-text-dark/60 hover:bg-white/5 hover:text-text-dark/80"
              }`}
              onClick={() => onSelectPage(page.id)}
              type="button"
            >
              <span className="mr-2">{page.icon}</span>
              {page.title}
              {!page.isPublished && (
                <span className="ml-2 text-[10px] text-text-dark/30">draft</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
