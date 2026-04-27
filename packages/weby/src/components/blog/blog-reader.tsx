import { useEffect, useMemo, useRef, useState } from "react";
import { markdownToHtml } from "../../lib/markdown-to-html";
import type { BlogPost } from "../../types";
import { BlogFileTree } from "./blog-file-tree";
import { BlogTableOfContents } from "./blog-table-of-contents";
import { ReadonlyBlogEditor } from "./readonly-blog-editor";

interface BlogReaderProps {
  post: BlogPost;
}

export const BlogReader = ({ post }: BlogReaderProps) => {
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
    <div className="flex h-full min-h-0 flex-col p-4 text-white sm:p-6 lg:p-8">
      <button className="mb-6 self-start text-[13px] text-[#b58cff]" type="button">
        all blogs
      </button>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-h-0 overflow-y-auto pr-2" ref={scrollContainerRef}>
          <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 lg:space-y-8">
            <header className="space-y-4">
              <h2 className="text-4xl">{post.title}</h2>
              <p className="text-sm text-white/55">
                {post.publishedAt} • {post.readTimeMinutes} min read
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    className="border border-[#6e4e99] px-3 py-1 text-[12px] text-[#d1b3ff]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="max-w-2xl text-white/80">{post.description}</p>
            </header>

            <ReadonlyBlogEditor html={html} />

            <div className="sticky bottom-0 mt-8 flex items-center justify-between border-t border-white/10 bg-black pt-6 text-[13px] text-[#b58cff]">
              <button type="button">prev post</button>
              <button type="button">next post</button>
            </div>
          </div>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <BlogTableOfContents
            activeHeadingId={activeHeadingId}
            headings={post.headings || []}
            onSelect={handleSelectHeading}
          />
          <BlogFileTree />
        </aside>
      </div>
    </div>
  );
};
