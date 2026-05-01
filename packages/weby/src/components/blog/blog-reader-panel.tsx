import { BlogReader } from "./blog-reader";
import { BlogFileTree } from "./blog-file-tree";
import { useBlogPost } from "../../hooks/use-blog-post";
import type { BlogManifestSection } from "#/types";

interface BlogReaderPanelProps {
  slug: string;
  isDarkMode: boolean;
  isMobile: boolean;
  manifest: BlogManifestSection[];
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
  manifest,
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
      <div className="flex h-full min-h-0 flex-col p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <p className={`text-[13px] ${isDarkMode ? "text-text-dark/30" : "text-text-light/30"}`}>
            no articles yet — browse projects below
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <BlogFileTree
            isDarkMode={isDarkMode}
            manifest={manifest}
            onSelectPost={onSelectPost}
            onSelectProject={onSelectProject}
            projects={projects}
          />
        </div>
      </div>
    );
  }

  return (
    <BlogReader
      isDarkMode={isDarkMode}
      isMobile={isMobile}
      manifest={manifest}
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
