import type { ConsolePageDetail } from "#/types";
import { useQuery } from "@tanstack/react-query";
import { fetchProtected } from "../../hooks/fetch-protected";

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

  if (isPending) {
    return <p className="text-[13px] text-text-dark/40">loading page...</p>;
  }

  if (isError) {
    return <p className="text-[13px] text-red-400">failed to load page</p>;
  }

  if (!page) {
    return <p className="text-[13px] text-text-dark/40">page not found</p>;
  }

  return (
    <article className="mx-auto max-w-2xl">
      <header className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{page.icon}</span>
          <h2 className="text-lg font-medium text-text-dark">{page.title}</h2>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-text-dark/40">
          <span>{page.isPublished ? "published" : "draft"}</span>
          <span>slug: {page.slugId}</span>
          <span>updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
        </div>
        {page.coverPhoto && (
          <img
            alt={`Cover for ${page.title}`}
            className="w-full rounded border border-border-dark object-cover"
            src={page.coverPhoto}
          />
        )}
      </header>
      <div className="max-w-none">
        <pre className="whitespace-pre-wrap wrap-break-word rounded border border-border-dark bg-black/20 p-4 text-[13px] text-text-dark/70">
          {page.textContent}
        </pre>
      </div>
    </article>
  );
};
