import { describe, expect, it } from "vitest";
import { extractBlogHeadings } from "./blog-headings";

describe("extractBlogHeadings", () => {
  it("extracts heading ids, labels, and levels from rendered markup", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1>why crdts?</h1>
      <h2>core properties</h2>
      <h2>types of crdts</h2>
    `;

    const headings = extractBlogHeadings(container);

    expect(headings).toEqual([
      { id: "why-crdts", label: "why crdts?", level: 1 },
      { id: "core-properties", label: "core properties", level: 2 },
      { id: "types-of-crdts", label: "types of crdts", level: 2 },
    ]);
  });
});
