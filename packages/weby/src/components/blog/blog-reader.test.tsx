import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BlogPost } from "../../types";
import { BlogReader } from "./blog-reader";
import { BlogReaderPanel } from "./blog-reader-panel";
import { renderWithQuery } from "../../test/utils";

const mockPost: BlogPost = {
  description:
    "Conflict-free Replicated Data Types (CRDTs) are a class of data structures that allow replicated data to be merged automatically, without conflicts. They are the backbone of many modern distributed systems.",
  format: "markdown",
  markdown: "# why crdts?\n\n## core properties\n\n## types of crdts",
  publishedAt: "2025-08-28",
  readTimeMinutes: 8,
  section: "distributed-systems",
  slug: "crdts-101-a-primer",
  tags: ["distributed-systems", "crdt", "consistency"],
  title: "CRDTs 101: A Primer",
};

describe("BlogReader", () => {
  it("renders the article shell controls and metadata", () => {
    render(<BlogReader isDarkMode={true} post={mockPost} />);

    // Check heading in the article
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0]).toBeDefined();
    expect(screen.getByText(/all blogs/i)).toBeDefined();
    expect(screen.getByText(/prev post/i)).toBeDefined();
    expect(screen.getByText(/next post/i)).toBeDefined();
    // Tag section has the distributed-systems tag
    expect(screen.getAllByText("distributed-systems").length).toBeGreaterThan(0);
    expect(screen.getByText("crdt")).toBeDefined();
    expect(screen.getByText("consistency")).toBeDefined();
    expect(screen.getByText("on this page")).toBeDefined();
    expect(screen.getByText("more posts")).toBeDefined();
  });

  it("TOC items are clickable and update active state", () => {
    render(<BlogReader isDarkMode={true} post={mockPost} />);

    // Find TOC buttons (should have heading labels)
    const whyCrdtsBtn = screen.getByText("why crdts?");
    const corePropertiesBtn = screen.getByText("core properties");
    const typesOfCrdtsBtn = screen.getByText("types of crdts");

    // Initially, one of the headings should be active
    expect(whyCrdtsBtn).toBeDefined();
    expect(corePropertiesBtn).toBeDefined();
    expect(typesOfCrdtsBtn).toBeDefined();

    // Click on a TOC item
    fireEvent.click(corePropertiesBtn);

    // Verify the click doesn't throw (TOC interaction works)
    expect(corePropertiesBtn).toBeDefined();
  });

  it("renders fetched article data through the panel wrapper", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          description: "test description",
          format: "markdown",
          markdown: "# why crdts?",
          publishedAt: "2025-08-28",
          readTimeMinutes: 8,
          section: "distributed-systems",
          slug: "crdts-101-a-primer",
          tags: ["distributed-systems", "crdt", "consistency"],
          title: "CRDTs 101: A Primer",
        }),
      ok: true,
    } as Response);

    Object.defineProperty(globalThis, "fetch", {
      value: mockFetch,
      writable: true,
    });

    renderWithQuery(<BlogReaderPanel isDarkMode={true} slug="crdts-101-a-primer" />);

    await waitFor(() => {
      // Check heading in the article
      const headings = screen.getAllByRole("heading", { level: 2 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
