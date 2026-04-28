import { BlogReader } from "./blog-reader";
import { useBlogPost } from "../../hooks/use-blog-post";

interface BlogReaderPanelProps {
  slug: string;
  isDarkMode: boolean;
}

export const BlogReaderPanel = ({ slug, isDarkMode }: BlogReaderPanelProps) => {
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

  return <BlogReader isDarkMode={isDarkMode} post={data} />;
};
