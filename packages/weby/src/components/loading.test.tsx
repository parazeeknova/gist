import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingDots } from "./loading";

describe("LoadingDots", () => {
  it("renders loading dots", () => {
    render(<LoadingDots />);
    // The component renders three spans with animate-pulse
    const spans = document.querySelectorAll("span.animate-pulse");
    expect(spans.length).toBe(3);
  });

  it("has correct styling", () => {
    render(<LoadingDots />);
    const container = screen.getByText(
      (content, element) => element?.classList.contains("flex") ?? false,
    );
    expect(container).toBeDefined();
  });
});
