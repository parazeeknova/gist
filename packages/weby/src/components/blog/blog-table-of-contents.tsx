import type { BlogHeading } from "../../lib/blog-headings";

interface BlogTableOfContentsProps {
  activeHeadingId: string | null;
  headings: BlogHeading[];
  onSelect: (id: string) => void;
}

export const BlogTableOfContents = ({
  activeHeadingId,
  headings,
  onSelect,
}: BlogTableOfContentsProps) => (
  <div className="space-y-3">
    <p className="text-[13px] text-white/60">on this page</p>
    <div className="space-y-2 border-l border-white/10 pl-4">
      {headings.map((heading) => (
        <button
          className={heading.id === activeHeadingId ? "text-white" : "text-white/60"}
          key={heading.id}
          onClick={() => onSelect(heading.id)}
          style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          type="button"
        >
          {heading.label}
        </button>
      ))}
    </div>
  </div>
);
