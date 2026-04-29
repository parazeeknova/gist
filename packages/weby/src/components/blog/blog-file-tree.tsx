import type { BlogManifestPost, BlogManifestSection } from "#/types";

interface BlogFileTreeProps {
  activeProjectTitle?: string;
  activeSlug?: string;
  isDarkMode: boolean;
  manifest: BlogManifestSection[];
  onSelectPost?: (slug: string) => void;
  onSelectProject?: (project: { readmeUrl?: string; title: string }) => void;
  projects?: { readmeUrl?: string; title: string }[];
}

export const BlogFileTree = ({
  activeProjectTitle,
  activeSlug,
  isDarkMode,
  manifest,
  onSelectPost,
  onSelectProject,
  projects,
}: BlogFileTreeProps) => {
  const postClass = (isActive: boolean) => {
    if (isActive) {
      return isDarkMode ? "text-[#b58cff]" : "text-purple-600";
    }
    return "";
  };

  const projectClass = (isActive: boolean, hasReadme: boolean) => {
    if (isActive) {
      return isDarkMode ? "text-[#b58cff]" : "text-purple-600";
    }
    if (!hasReadme) {
      return "opacity-40";
    }
    return "";
  };

  return (
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
        {manifest.map((section) => (
          <div className="space-y-2" key={section.label}>
            <p>{section.label}</p>
            {section.children.length > 0 && (
              <div className="space-y-2 pl-4">
                {section.children.map((post: BlogManifestPost) => {
                  const isActive = post.slug === activeSlug;
                  return (
                    <button
                      className={`block text-left lowercase ${postClass(isActive)} hover:opacity-70 focus:outline-none`}
                      key={post.slug}
                      onClick={() => onSelectPost?.(post.slug)}
                      type="button"
                    >
                      {post.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {projects && projects.length > 0 && (
          <div className="space-y-2">
            <p>projects</p>
            <div className="space-y-2 pl-4">
              {projects.map((project, i) => {
                const isActive = activeProjectTitle === project.title;
                return (
                  <button
                    className={`block text-left lowercase hover:opacity-70 focus:outline-none ${projectClass(isActive, Boolean(project.readmeUrl))}`}
                    key={`${project.title}-${i.toString()}`}
                    onClick={() => project.readmeUrl && onSelectProject?.(project)}
                    type="button"
                  >
                    {project.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
