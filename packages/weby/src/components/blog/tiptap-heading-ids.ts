import { Heading } from "@tiptap/extension-heading";

export const HeadingWithIds = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const { level } = node.attrs;
    const textContent = node.textContent || "";
    const id = textContent
      .toLowerCase()
      .replaceAll(/[^\w\s-]/g, "")
      .replaceAll(/\s+/g, "-")
      .trim();

    return [`h${level}`, { ...HTMLAttributes, id }, 0];
  },
});
