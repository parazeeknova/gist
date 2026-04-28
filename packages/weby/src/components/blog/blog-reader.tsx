import { useEffect, useMemo, useRef, useState } from "react";
import { markdownToHtml } from "../../lib/markdown-to-html";
import type { BlogPost } from "../../types";
import { BlogFileTree } from "./blog-file-tree";
import { BlogTableOfContents } from "./blog-table-of-contents";
import { ReadonlyBlogEditor } from "./readonly-blog-editor";

interface BlogReaderProps {
  post: BlogPost;
  isDarkMode: boolean;
}

export const BlogReader = ({ post, isDarkMode }: BlogReaderProps) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const html = useMemo(() => markdownToHtml(post.markdown), [post.markdown]);

  // Set up IntersectionObserver for active heading tracking
  useEffect(() => {
    const headings = post.headings || [];
    if (headings.length === 0) {
      return;
    }

    // Disconnect previous observer
    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visibleHeadings = entries.filter((e) => e.isIntersecting);
        if (visibleHeadings.length > 0) {
          // Sort by their position in the DOM (topmost first)
          visibleHeadings.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const topMostId = visibleHeadings[0]?.target.id;
          if (topMostId) {
            setActiveHeadingId(topMostId);
          }
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0.1,
      },
    );

    // Observe all heading elements
    for (const heading of headings) {
      const el = document.querySelector(`#${heading.id}`);
      if (el) {
        observer.observe(el);
      }
    }

    observerRef.current = observer;

    return () => observer.disconnect();
  }, [post]);

  const handleSelectHeading = (id: string) => {
    const el = document.querySelector(`#${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(id);
    }
  };

  return (
    <div
      data-theme={isDarkMode ? "dark" : "light"}
      className={`flex h-full min-h-0 flex-col p-4 sm:p-6 lg:p-8 ${
        isDarkMode ? "text-text-dark" : "text-text-light"
      }`}
    >
      <button
        className={`mb-6 self-start text-[13px] ${isDarkMode ? "text-[#b58cff]" : "text-purple-600"}`}
        type="button"
      >
        all blogs
      </button>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-h-0 overflow-y-auto pr-2" ref={scrollContainerRef}>
          <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 lg:space-y-8">
            <header className="space-y-4">
              <h2 className="text-4xl">{post.title}</h2>
              <p className={`text-sm ${isDarkMode ? "text-text-dark/55" : "text-text-light/55"}`}>
                {post.publishedAt} • {post.readTimeMinutes} min read
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    className={`border px-3 py-1 text-[12px] ${
                      isDarkMode
                        ? "border-[#6e4e99] text-[#d1b3ff]"
                        : "border-purple-200 text-purple-700"
                    }`}
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className={`max-w-2xl ${isDarkMode ? "text-text-dark/80" : "text-text-light/80"}`}>
                {post.description}
              </p>
            </header>

            <ReadonlyBlogEditor html={html} />

            <div
              className={`sticky bottom-0 mt-8 flex items-center justify-between border-t pt-6 text-[13px] theme-bg ${
                isDarkMode
                  ? "border-border-dark text-[#b58cff]"
                  : "border-border-light text-purple-600"
              }`}
            >
              <button type="button">prev post</button>
              <button type="button">next post</button>
            </div>
          </div>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <BlogTableOfContents
            activeHeadingId={activeHeadingId}
            headings={post.headings || []}
            isDarkMode={isDarkMode}
            onSelect={handleSelectHeading}
          />
          <BlogFileTree isDarkMode={isDarkMode} />
        </aside>
      </div>
    </div>
  );
};
