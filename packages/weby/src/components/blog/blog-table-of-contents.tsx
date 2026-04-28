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
        let textColor: string;
        if (isActive) {
          textColor = isDarkMode ? "text-text-dark" : "text-text-light";
        } else {
          textColor = isDarkMode ? "text-text-dark/60" : "text-text-light/60";
        }
        return (
          <button
            className={textColor}
            key={heading.id}
            onClick={() => onSelect(heading.id)}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            type="button"
          >
            {heading.label}
          </button>
        );
      })}
    </div>
  </div>
);
