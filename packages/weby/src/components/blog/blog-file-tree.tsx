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

export const BlogFileTree = () => (
  <div className="space-y-3">
    <p className="text-[13px] text-white/60">more posts</p>
    <div className="space-y-3 border-l border-white/10 pl-4 text-[13px] text-white/70">
      {BLOG_FILE_TREE.map((section) => (
        <div className="space-y-2" key={section.label}>
          <p>{section.label}</p>
          {section.children.length > 0 ? (
            <div className="space-y-2 pl-4">
              {section.children.map((entry) => (
                <p className={entry === "crdts-101-a-primer" ? "text-[#b58cff]" : ""} key={entry}>
                  {entry}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);
