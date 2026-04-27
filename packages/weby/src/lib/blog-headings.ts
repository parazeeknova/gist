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

  for (const element of elements) {
    const label = element.textContent?.trim() ?? "";
    if (label.length === 0) {
      continue;
    }

    const id = slugify(label);
    element.id = id;
    headings.push({
      id,
      label,
      level: Number(element.tagName.slice(1)),
    });
  }

  return headings;
};
