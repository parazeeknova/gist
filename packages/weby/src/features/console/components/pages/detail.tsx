import { useTheme } from "#/shared/hooks/use-theme";
import { useConsolePage } from "#/features/console/hooks/use-pages";
import { PageEditor } from "#/features/editor/components/page-editor";

interface PageDetailProps {
  pageId: string;
}

export const PageDetail = ({ pageId }: PageDetailProps) => {
  const { data: page, isPending, isError } = useConsolePage(pageId);
  const { isDarkMode } = useTheme();

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
    <div className="h-full flex flex-col">
      <PageEditor
        contentJson={page.contentJson}
        editable={true}
        pageId={page.id}
        title={page.title}
      />
    </div>
  );
};
