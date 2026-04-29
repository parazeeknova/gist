import { BlogReader } from "./blog-reader";
import { useBlogPost } from "../../hooks/use-blog-post";

interface BlogReaderPanelProps {
  slug: string;
  isDarkMode: boolean;
  isMobile: boolean;
  onToggleTheme?: () => void;
  onSwitchToAbout?: () => void;
  onSelectPost?: (slug: string) => void;
  onSelectProject?: (project: { readmeUrl?: string; title: string }) => void;
  projects?: { readmeUrl?: string; title: string }[];
  themeButtonRef?: React.RefObject<HTMLButtonElement | null>;
  themeIndicatorRef?: React.RefObject<HTMLSpanElement | null>;
}

export const BlogReaderPanel = ({
  slug,
  isDarkMode,
  isMobile,
  onToggleTheme,
  onSwitchToAbout,
  onSelectPost,
  onSelectProject,
  projects,
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
      onSelectPost={onSelectPost}
      onSelectProject={onSelectProject}
      onSwitchToAbout={onSwitchToAbout}
      onToggleTheme={onToggleTheme}
      post={data}
      projects={projects}
      themeButtonRef={themeButtonRef}
      themeIndicatorRef={themeIndicatorRef}
    />
  );
};
