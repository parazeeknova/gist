import { BlogReader } from "./blog-reader";
import { useBlogPost } from "../../hooks/use-blog-post";

interface BlogReaderPanelProps {
  slug: string;
  isDarkMode: boolean;
  isMobile: boolean;
  onToggleTheme?: () => void;
  onSwitchToAbout?: () => void;
  themeButtonRef?: React.RefObject<HTMLButtonElement | null>;
  themeIndicatorRef?: React.RefObject<HTMLSpanElement | null>;
}

export const BlogReaderPanel = ({
  slug,
  isDarkMode,
  isMobile,
  onToggleTheme,
  onSwitchToAbout,
  themeButtonRef,
  themeIndicatorRef,
}: BlogReaderPanelProps) => {
  const { data, isError, isPending } = useBlogPost(slug);

  if (isPending) {
    return (
      <div
        className={`px-8 py-10 text-sm ${isDarkMode ? "text-text-dark/60" : "text-text-light/60"}`}
      >
        loading article...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`px-8 py-10 text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
        failed to load article.
      </div>
    );
  }

  return (
    <BlogReader
      isDarkMode={isDarkMode}
      isMobile={isMobile}
      onSwitchToAbout={onSwitchToAbout}
      onToggleTheme={onToggleTheme}
      post={data}
      themeButtonRef={themeButtonRef}
      themeIndicatorRef={themeIndicatorRef}
    />
  );
};
