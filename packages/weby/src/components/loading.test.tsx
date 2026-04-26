import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingDots } from "./loading";

describe("LoadingDots", () => {
  it("renders loading text", () => {
    render(<LoadingDots />);
    expect(screen.getByText("loading...")).toBeDefined();
  });

  it("has correct styling classes", () => {
    render(<LoadingDots />);
    const span = screen.getByText("loading...");
    expect(span.classList.contains("animate-pulse")).toBe(true);
    expect(span.classList.contains("inline-block")).toBe(true);
  });
});
