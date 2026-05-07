import { marked } from "marked";

const YAML_FRONTMATTER_REGEX = /^\s*---[\s\S]*?---\s*/;

marked.setOptions({ breaks: true });

export const markdownToHtml = (markdownInput: string): string =>
  marked.parse(markdownInput.replace(YAML_FRONTMATTER_REGEX, "").trimStart()).toString();
