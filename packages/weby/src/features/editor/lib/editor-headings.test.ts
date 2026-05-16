import { describe, expect, it } from "vitest";
import { extractEditorHeadings } from "./editor-headings";

describe("extractEditorHeadings", () => {
  it("extracts headings from editor json with unique ids", () => {
    const headings = extractEditorHeadings({
      content: [
        { attrs: { level: 1 }, content: [{ text: "Intro", type: "text" }], type: "heading" },
        { attrs: { level: 2 }, content: [{ text: "Intro", type: "text" }], type: "heading" },
        { attrs: { level: 3 }, content: [{ text: "Details", type: "text" }], type: "heading" },
      ],
      type: "doc",
    });

    expect(headings).toEqual([
      { id: "intro", label: "Intro", level: 1 },
      { id: "intro-2", label: "Intro", level: 2 },
      { id: "details", label: "Details", level: 3 },
    ]);
  });

  it("ignores empty and out-of-range headings", () => {
    const headings = extractEditorHeadings({
      content: [
        { attrs: { level: 4 }, content: [{ text: "Skip", type: "text" }], type: "heading" },
        { attrs: { level: 2 }, content: [], type: "heading" },
      ],
      type: "doc",
    });

    expect(headings).toEqual([]);
  });
});
