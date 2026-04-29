import type { BlogHeading } from "../../lib/blog-headings";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

interface BlogTableOfContentsProps {
  activeHeadingId: string | null;
  headings: BlogHeading[];
  isDarkMode: boolean;
  onSelect: (id: string) => void;
}

export const BlogTableOfContents = ({
  activeHeadingId,
  headings,
  isDarkMode,
  onSelect,
}: BlogTableOfContentsProps) => {
  const itemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (!activeHeadingId) {
      return;
    }
    const el = itemsRef.current.get(activeHeadingId);
    if (!el) {
      return;
    }
    gsap.fromTo(
      el,
      { backgroundColor: isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)" },
      {
        backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        duration: 0.35,
        ease: "power2.out",
      },
    );
  }, [activeHeadingId, isDarkMode]);

  return (
    <div className="space-y-3">
      <p className={`text-[13px] ${isDarkMode ? "text-text-dark/60" : "text-text-light/60"}`}>
        on this page
      </p>
      <div
        className={`space-y-2 border-l pl-4 ${isDarkMode ? "border-border-dark" : "border-border-light"}`}
      >
        {headings.map((heading) => {
          const isActive = heading.id === activeHeadingId;
          let itemClass = "block border-l-2 px-2 py-0.5 text-left ";
          if (isActive) {
            itemClass += isDarkMode
              ? "border-[#b58cff] bg-white/8 text-text-dark"
              : "border-purple-600 bg-black/6 text-text-light";
          } else {
            itemClass += "border-transparent ";
            itemClass += isDarkMode ? "text-text-dark/60" : "text-text-light/60";
          }
          return (
            <button
              className={itemClass}
              key={heading.id}
              onClick={() => onSelect(heading.id)}
              ref={(el) => {
                if (el) {
                  itemsRef.current.set(heading.id, el);
                }
              }}
              style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
              title={heading.label}
              type="button"
            >
              <span className="block truncate">{heading.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
