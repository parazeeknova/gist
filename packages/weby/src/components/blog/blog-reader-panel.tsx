import { BlogReader } from "./blog-reader";
import { useBlogPost } from "../../hooks/use-blog-post";

interface BlogReaderPanelProps {
  slug: string;
}

export const BlogReaderPanel = ({ slug }: BlogReaderPanelProps) => {
  const { data, isError, isPending } = useBlogPost(slug);

  if (isPending) {
    return <div className="px-8 py-10 text-sm text-white/60">loading article...</div>;
  }

  if (isError || !data) {
    return <div className="px-8 py-10 text-sm text-red-300">failed to load article.</div>;
  }

  return <BlogReader post={data} />;
};
