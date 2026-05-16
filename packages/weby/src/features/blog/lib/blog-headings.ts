export interface BlogHeading {
  id: string;
  label: string;
  level: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-");

export const extractBlogHeadings = (container: HTMLElement): BlogHeading[] => {
  const elements = container.querySelectorAll("h1, h2, h3");
  const headings: BlogHeading[] = [];
  const slugCounts = new Map<string, number>();

  for (const element of elements) {
    const label = element.textContent?.trim() ?? "";
    if (label.length === 0) {
      continue;
    }

    const baseId = slugify(label) || `heading-${headings.length + 1}`;
    const nextCount = (slugCounts.get(baseId) ?? 0) + 1;
    slugCounts.set(baseId, nextCount);
    const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
    element.id = id;
    headings.push({
      id,
      label,
      level: Number(element.tagName.slice(1)),
    });
  }

  return headings;
};
