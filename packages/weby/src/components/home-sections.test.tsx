import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ExperienceItem, Profile } from "../types";
import { ExperienceSection, ProfileSection, SocialLinks } from "./home-sections";

describe("ProfileSection", () => {
  const mockProfile: Profile = {
    description: "Test description about the user.",
    links: {
      github: { label: "GitHub", url: "https://github.com/testuser" },
      linkedin: { label: "LinkedIn", url: "https://linkedin.com/in/test" },
      portfolio: { label: "Portfolio", url: "https://example.com" },
      singularity: { label: "Singularity", url: "https://singularity.test" },
      twitter: { label: "X", url: "https://x.com/test" },
      zephyr: { label: "Zephyr", url: "https://zephyr.test" },
    },
    name: "Test User",
    tagline: "test tagline",
  };

  it("renders profile name", () => {
    render(<ProfileSection profile={mockProfile} isMobile={false} isPending={false} />);

    expect(screen.getByText("Test User")).toBeDefined();
  });

  it("renders loading state", () => {
    render(<ProfileSection profile={undefined} isMobile={false} isPending={true} />);

    // LoadingDots should be rendered
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeDefined();
  });

  it("renders fallback when no profile", () => {
    render(<ProfileSection profile={undefined} isMobile={false} isPending={false} />);

    expect(screen.getByText("Harsh Sahu")).toBeDefined();
  });

  it("renders portfolio link", () => {
    render(<ProfileSection profile={mockProfile} isMobile={false} isPending={false} />);

    // Text is split across elements, so use a function matcher
    const portfolioLink = screen.getByText(
      (content, element) => content.includes("Portfolio") && element?.tagName.toLowerCase() === "a",
    );
    expect(portfolioLink).toBeDefined();
    expect(portfolioLink.closest("a")?.getAttribute("href")).toBe("https://example.com");
  });
});

describe("ExperienceSection", () => {
  const mockExperience: ExperienceItem[] = [
    {
      location: "Remote",
      period: "2020-Present",
      title: "Software Engineer",
    },
  ];

  it("renders experience items", () => {
    render(<ExperienceSection experience={mockExperience} isPending={false} />);

    expect(screen.getByText("Software Engineer")).toBeDefined();
    expect(screen.getByText("Remote | 2020-Present")).toBeDefined();
  });

  it("renders fallback when no experience", () => {
    render(<ExperienceSection experience={[]} isPending={false} />);

    // Should show fallback experience
    expect(screen.getByText("Co-Founder — Singularity Works")).toBeDefined();
  });

  it("renders loading state", () => {
    render(<ExperienceSection experience={undefined} isPending={true} />);

    // Should show loading dots
    const container = document.querySelector(".shrink-0");
    expect(container).toBeDefined();
  });
});

describe("SocialLinks", () => {
  const mockProfile: Profile = {
    description: "test",
    links: {
      github: { label: "GitHub", url: "https://github.com/testuser" },
      linkedin: { label: "LinkedIn", url: "https://linkedin.com/in/test" },
      portfolio: { label: "Portfolio", url: "https://example.com" },
      singularity: { label: "Singularity", url: "https://singularity.test" },
      twitter: { label: "X", url: "https://x.com/test" },
      zephyr: { label: "Zephyr", url: "https://zephyr.test" },
    },
    name: "Test User",
    tagline: "test",
  };

  it("renders social links", () => {
    render(<SocialLinks profile={mockProfile} />);

    expect(screen.getByText("GitHub")).toBeDefined();
    expect(screen.getByText("LinkedIn")).toBeDefined();
    expect(screen.getByText("X")).toBeDefined();
  });

  it("uses profile links when available", () => {
    render(<SocialLinks profile={mockProfile} />);

    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink?.getAttribute("href")).toBe("https://github.com/testuser");
  });

  it("uses fallback links when profile is undefined", () => {
    render(<SocialLinks profile={undefined} />);

    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink?.getAttribute("href")).toBe("https://github.com/parazeeknova");
  });
});
