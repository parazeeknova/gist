import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./markdown-to-html";

describe("markdownToHtml", () => {
  it("strips frontmatter before rendering", () => {
    const html = markdownToHtml(`---
title: example
---

# why crdts?`);

    expect(html).toContain("<h1>why crdts?</h1>");
    expect(html).not.toContain("title: example");
  });

  it("renders ordered and unordered lists", () => {
    const html = markdownToHtml(`1. first
2. second

- alpha
- beta`);

    expect(html).toContain("<ol>");
    expect(html).toContain("<ul>");
  });
});
