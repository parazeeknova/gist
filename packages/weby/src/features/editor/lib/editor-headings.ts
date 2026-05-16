import type { BlogHeading } from "#/features/blog/lib/blog-headings";

interface EditorNode {
  attrs?: { level?: unknown };
  content?: EditorNode[];
  text?: string;
  type?: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-");

const collectText = (nodes: EditorNode[]): string => {
  let result = "";
  for (const node of nodes) {
    if (typeof node.text === "string") {
      result += node.text;
    }
    if (Array.isArray(node.content)) {
      result += collectText(node.content);
    }
  }
  return result;
};

export const extractEditorHeadings = (content: unknown): BlogHeading[] => {
  if (!content || typeof content !== "object" || !("content" in content)) {
    return [];
  }

  const headings: BlogHeading[] = [];
  const slugCounts = new Map<string, number>();

  const walk = (nodes: EditorNode[]): void => {
    for (const node of nodes) {
      if (node.type === "heading") {
        const level = Number(node.attrs?.level ?? 1);
        if (level < 1 || level > 3) {
          continue;
        }

        const label = collectText(node.content ?? []).trim();
        if (label.length === 0) {
          continue;
        }

        const baseId = slugify(label) || `heading-${headings.length + 1}`;
        const nextCount = (slugCounts.get(baseId) ?? 0) + 1;
        slugCounts.set(baseId, nextCount);
        const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;

        headings.push({ id, label, level });
      }

      if (Array.isArray(node.content)) {
        walk(node.content);
      }
    }
  };

  walk((content as { content?: EditorNode[] }).content ?? []);
  return headings;
};
