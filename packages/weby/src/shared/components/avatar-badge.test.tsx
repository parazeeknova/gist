import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "#/shared/test/utils";
import { AvatarBadge } from "./avatar-badge";

const MockImage = function MockImage() {
  return {
    decode: () => Promise.resolve(),
    decoding: "",
    src: "",
  };
} as unknown as typeof Image;

describe("AvatarBadge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders initials when no icon is provided", () => {
    render(<AvatarBadge className="h-4 w-4" name="space alpha" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("SA")).toBeDefined();
    expect(screen.getByRole("img", { name: "space alpha avatar" })).toBeDefined();
  });

  it("renders an image when an icon is provided", async () => {
    vi.stubGlobal("Image", MockImage);

    render(<AvatarBadge className="h-4 w-4" icon="/space.png" name="space alpha" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByAltText("space alpha avatar")).toBeDefined();
  });
});
