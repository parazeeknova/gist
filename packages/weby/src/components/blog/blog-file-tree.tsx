interface BlogFileTreeProps {
  isDarkMode: boolean;
}

const BLOG_FILE_TREE = [
  {
    children: ["crdts-101-a-primer", "eventual-consistency-explained", "vector-clocks-explained"],
    label: "distributed-systems",
  },
  { children: [], label: "databases" },
  { children: [], label: "web" },
  { children: [], label: "tools" },
  { children: [], label: "notes" },
];

export const BlogFileTree = ({ isDarkMode }: BlogFileTreeProps) => (
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
      {BLOG_FILE_TREE.map((section) => (
        <div className="space-y-2" key={section.label}>
          <p>{section.label}</p>
          {section.children.length > 0 ? (
            <div className="space-y-2 pl-4">
              {section.children.map((entry) => {
                const isActive = entry === "crdts-101-a-primer";
                let entryClass = "";
                if (isActive) {
                  entryClass = isDarkMode ? "text-[#b58cff]" : "text-purple-600";
                }
                return (
                  <p className={entryClass} key={entry}>
                    {entry}
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
