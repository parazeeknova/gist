import { BLOG_MANIFEST } from "./blog-manifest";
import type { BlogManifestPost } from "./blog-manifest";

interface BlogFileTreeProps {
  activeSlug?: string;
  isDarkMode: boolean;
}

export const BlogFileTree = ({ activeSlug, isDarkMode }: BlogFileTreeProps) => (
  <div className="space-y-3">
    <p className={`text-[13px] ${isDarkMode ? "text-text-dark/60" : "text-text-light/60"}`}>
      more posts
    </p>
    <div
      className={`space-y-3 border-l pl-4 text-[13px] ${
        isDarkMode
          ? "border-border-dark text-text-dark/70"
          : "border-border-light text-text-light/70"
      }`}
    >
      {BLOG_MANIFEST.map((section) => (
        <div className="space-y-2" key={section.label}>
          <p>{section.label}</p>
          {section.children.length > 0 ? (
            <div className="space-y-2 pl-4">
              {section.children.map((post: BlogManifestPost) => {
                const isActive = post.slug === activeSlug;
                let entryClass = "";
                if (isActive) {
                  entryClass = isDarkMode ? "text-[#b58cff]" : "text-purple-600";
                }
                return (
                  <p className={entryClass} key={post.slug}>
                    {post.title}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);
