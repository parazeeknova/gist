import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractBlogHeadings } from "../lib/blog-headings";
import { markdownToHtml } from "../lib/markdown-to-html";
import { BlogFileTree } from "./blog/blog-file-tree";
import { BlogTableOfContents } from "./blog/blog-table-of-contents";

interface ReadmeViewerProps {
  isDarkMode: boolean;
  isMobile: boolean;
  onBack: () => void;
  onSelectPost?: (slug: string) => void;
  onSelectProject?: (project: { readmeUrl?: string; title: string }) => void;
  onSwitchToAbout?: () => void;
  onToggleTheme?: () => void;
  projectTitle: string;
  projects?: { readmeUrl?: string; title: string }[];
  readmeUrl: string;
  themeButtonRef?: React.RefObject<HTMLButtonElement | null>;
  themeIndicatorRef?: React.RefObject<HTMLSpanElement | null>;
}

export const ReadmeViewer = ({
  isDarkMode,
  isMobile,
  onBack,
  onSelectPost,
  onSelectProject,
  onSwitchToAbout,
  onToggleTheme,
  projectTitle,
  projects,
  readmeUrl,
  themeButtonRef,
  themeIndicatorRef,
}: ReadmeViewerProps) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: markdown,
    isPending,
    isError,
  } = useQuery({
    queryFn: async ({ signal }) => {
      const res = await fetch(readmeUrl, { signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.text();
    },
    queryKey: ["readme", readmeUrl],
    staleTime: 5 * 60 * 1000,
  });

  // Pre-process HTML to embed heading IDs so they exist when React sets innerHTML
  const { html, headings } = useMemo(() => {
    if (!markdown) {
      return { headings: [], html: "" };
    }
    const raw = markdownToHtml(markdown);
    const div = document.createElement("div");
    div.innerHTML = raw;

    // Collapse center-aligned kbd button sections into a <details> block
    const centerDivs = div.querySelectorAll<HTMLDivElement>('div[align="center"]');
    for (const center of centerDivs) {
      if (center.querySelector("kbd")) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "kbd elements";
        summary.style.cssText =
          "cursor:pointer;font-size:0.85em;opacity:0.6;margin-bottom:0.75rem;user-select:none;";
        details.append(summary);
        details.append(center.cloneNode(true));
        center.replaceWith(details);
      }
    }

    const extracted = extractBlogHeadings(div);
    return { headings: extracted, html: div.innerHTML };
  }, [markdown]);

  const handleSelectHeading = useCallback((id: string) => {
    const el = contentRef.current?.querySelector(`#${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(id);
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || headings.length === 0) {
      return;
    }

    const headingElements = headings
      .map((h) => container.querySelector(`#${h.id}`))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveHeadingId(visible[0].target.id);
        }
      },
      { root: container, rootMargin: "-10% 0px -80% 0px", threshold: 0.1 },
    );

    for (const el of headingElements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  let content: React.ReactNode;
  if (isPending) {
    content = (
      <p className={`text-sm ${isDarkMode ? "text-text-dark/60" : "text-text-light/60"}`}>
        loading readme...
      </p>
    );
  } else if (isError) {
    content = (
      <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
        failed to load readme.
      </p>
    );
  } else {
    content = (
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-h-0 overflow-y-auto pr-2" ref={scrollRef}>
          <div
            className="blog-reader-prose mx-auto max-w-3xl"
            dangerouslySetInnerHTML={{ __html: html }}
            ref={contentRef}
          />
        </div>
        <aside className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <BlogTableOfContents
            activeHeadingId={activeHeadingId}
            headings={headings}
            isDarkMode={isDarkMode}
            onSelect={handleSelectHeading}
          />
          <BlogFileTree
            activeProjectTitle={projectTitle}
            isDarkMode={isDarkMode}
            onSelectPost={onSelectPost}
            onSelectProject={onSelectProject}
            projects={projects}
          />
        </aside>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col p-4 sm:p-6 lg:p-8 ${
        isDarkMode ? "text-text-dark" : "text-text-light"
      }`}
    >
      <div className="mb-6 flex items-center gap-3">
        <button
          className={`text-[13px] ${isDarkMode ? "text-[#b58cff]" : "text-purple-600"}`}
          onClick={onBack}
          type="button"
        >
          back
        </button>
        <p className={`text-[13px] ${isDarkMode ? "text-text-dark/60" : "text-text-light/60"}`}>
          {projectTitle}
        </p>
        <div className="flex-1" />
        {isMobile && (
          <>
            <button
              className={`text-[13px] lowercase focus:outline-none hover:opacity-70 ${
                isDarkMode ? "text-text-dark/60" : "text-text-light/60"
              }`}
              onClick={onSwitchToAbout}
              type="button"
            >
              about
            </button>
            <button
              aria-label="Toggle theme"
              className="rounded-full p-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-current/40"
              onClick={onToggleTheme}
              ref={themeButtonRef}
              type="button"
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className="block h-3 w-3 rounded-full border border-current"
                ref={themeIndicatorRef}
                style={{ backgroundColor: "transparent" }}
              />
            </button>
          </>
        )}
      </div>

      {content}
    </div>
  );
};
