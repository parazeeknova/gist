import type { BlogHeading } from "../../lib/blog-headings";

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
}: BlogTableOfContentsProps) => (
  <div className="space-y-3">
    <p className={`text-[13px] ${isDarkMode ? "text-text-dark/60" : "text-text-light/60"}`}>
      on this page
    </p>
    <div
      className={`space-y-2 border-l pl-4 ${isDarkMode ? "border-border-dark" : "border-border-light"}`}
    >
      {headings.map((heading) => {
        const isActive = heading.id === activeHeadingId;
        let itemClass = "block rounded px-2 py-0.5 text-left ";
        if (isActive) {
          itemClass += isDarkMode
            ? "bg-[rgba(181,140,255,0.12)] text-[#b58cff]"
            : "bg-purple-100 text-purple-600";
        } else {
          itemClass += isDarkMode ? "text-text-dark/60" : "text-text-light/60";
        }
        return (
          <button
            className={itemClass}
            key={heading.id}
            onClick={() => onSelect(heading.id)}
            style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
            type="button"
          >
            {heading.label}
          </button>
        );
      })}
    </div>
  </div>
);
