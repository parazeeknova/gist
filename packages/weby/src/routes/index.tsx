import { useEffect, useRef, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { gsap } from "gsap";
import Projects from "../components/projects";
import { GitHubActivity } from "../components/github-calendar";
import { GitHubStats } from "../components/github-stats";
import { ProfileSection, ExperienceSection, SocialLinks } from "../components/home-sections";
import { useProfile, useExperience, useIsFetchingData } from "../hooks/use-data";

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 1024);
    }
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

  return isMobile;
};

interface LinkRefs {
  portfolioRef: React.RefObject<HTMLAnchorElement | null>;
  zephyrRef: React.RefObject<HTMLAnchorElement | null>;
  singularityRef: React.RefObject<HTMLAnchorElement | null>;
  githubRef: React.RefObject<HTMLAnchorElement | null>;
  linkedinRef: React.RefObject<HTMLAnchorElement | null>;
  twitterRef: React.RefObject<HTMLAnchorElement | null>;
}

const useAnimatedLinks = (): LinkRefs => {
  const portfolioRef = useRef<HTMLAnchorElement>(null);
  const zephyrRef = useRef<HTMLAnchorElement>(null);
  const singularityRef = useRef<HTMLAnchorElement>(null);
  const githubRef = useRef<HTMLAnchorElement>(null);
  const linkedinRef = useRef<HTMLAnchorElement>(null);
  const twitterRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const links = [
      portfolioRef.current,
      zephyrRef.current,
      singularityRef.current,
      githubRef.current,
      linkedinRef.current,
      twitterRef.current,
    ].filter(Boolean) as HTMLAnchorElement[];

    const handlers: { enter: () => void; leave: () => void }[] = [];

    for (const link of links) {
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(
        link,
        { "--underline-width": "0%" } as gsap.TweenVars,
        { "--underline-width": "100%", duration: 0.3, ease: "power2.out" } as gsap.TweenVars,
      );

      const enter = () => tl.play();
      const leave = () => tl.reverse();
      handlers.push({ enter, leave });

      link.addEventListener("mouseenter", enter);
      link.addEventListener("mouseleave", leave);
      link.setAttribute("draggable", "false");
      link.addEventListener("dragstart", (e) => e.preventDefault());
    }

    return () => {
      for (const [index, link] of links.entries()) {
        if (handlers[index]) {
          link.removeEventListener("mouseenter", handlers[index].enter);
          link.removeEventListener("mouseleave", handlers[index].leave);
        }
      }
    };
  }, []);

  return { githubRef, linkedinRef, portfolioRef, singularityRef, twitterRef, zephyrRef };
};

interface ThemeButtonRefs {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  indicatorRef: React.RefObject<HTMLSpanElement | null>;
}

const useThemeButtonHover = (): ThemeButtonRefs => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const themeButton = buttonRef.current;
    const themeIndicator = indicatorRef.current;
    if (!themeButton || !themeIndicator) {
      return;
    }

    const enter = () => {
      const { color } = getComputedStyle(themeButton);
      gsap.to(themeIndicator, {
        backgroundColor: color,
        borderWidth: 0,
        duration: 0.18,
        ease: "power2.out",
      });
    };

    const leave = () => {
      gsap.to(themeIndicator, {
        backgroundColor: "rgba(0,0,0,0)",
        borderWidth: 1,
        duration: 0.18,
        ease: "power2.in",
      });
    };

    themeButton.addEventListener("mouseenter", enter);
    themeButton.addEventListener("mouseleave", leave);
    themeButton.addEventListener("focus", enter);
    themeButton.addEventListener("blur", leave);

    return () => {
      themeButton.removeEventListener("mouseenter", enter);
      themeButton.removeEventListener("mouseleave", leave);
      themeButton.removeEventListener("focus", enter);
      themeButton.removeEventListener("blur", leave);
    };
  }, []);

  return { buttonRef, indicatorRef };
};

const useThemeAnimation = (
  isDarkMode: boolean,
  leftPanelRef: React.RefObject<HTMLDivElement | null>,
  rightPanelRef: React.RefObject<HTMLDivElement | null>,
  mainContainerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    const mainContainer = mainContainerRef.current;
    if (!leftPanel || !rightPanel || !mainContainer) {
      return;
    }

    const tl = gsap.timeline();

    tl.to([leftPanel, rightPanel], {
      duration: 0.2,
      ease: "power2.in",
      opacity: 0.6,
    });

    tl.to(
      leftPanel,
      {
        backgroundColor: isDarkMode ? "#000000" : "hsl(0, 0%, 95%)",
        color: isDarkMode ? "#ffffff" : "#000000",
        duration: 0.8,
        ease: "power2.inOut",
      },
      0.1,
    );

    tl.to(
      rightPanel,
      {
        backgroundColor: isDarkMode ? "#000000" : "hsl(0, 0%, 95%)",
        duration: 0.8,
        ease: "power2.inOut",
      },
      0.1,
    );

    tl.to(
      mainContainer,
      {
        duration: 0.4,
        ease: "power2.inOut",
        repeat: 1,
        scale: 0.98,
        yoyo: true,
      },
      0.1,
    );

    tl.to(
      [leftPanel, rightPanel],
      {
        duration: 0.3,
        ease: "power2.out",
        opacity: 1,
      },
      0.7,
    );

    return () => {
      tl.kill();
    };
  }, [isDarkMode, leftPanelRef, rightPanelRef, mainContainerRef]);
};

const Home = function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const linkRefs = useAnimatedLinks();
  const themeRefs = useThemeButtonHover();

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useProfile();
  const { data: experience } = useExperience();
  const isPending = useIsFetchingData();

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  useThemeAnimation(isDarkMode, leftPanelRef, rightPanelRef, mainContainerRef);

  return (
    <div
      ref={mainContainerRef}
      className="relative grid min-h-screen grid-cols-1 overflow-hidden lg:h-screen lg:grid-cols-2"
    >
      <div
        ref={leftPanelRef}
        className="relative z-10 cursor-default p-4 font-mono select-none sm:p-6 lg:p-8"
        style={{ backgroundColor: "#000000", color: "#ffffff" }}
      >
        <button
          ref={themeRefs.buttonRef}
          onClick={toggleTheme}
          className="absolute top-4 right-4 rounded-full p-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-current/40 sm:top-6 sm:right-6 lg:top-8 lg:right-8"
          aria-label="Toggle theme"
        >
          <span className="sr-only">Toggle theme</span>
          <span
            ref={themeRefs.indicatorRef}
            className="block h-3 w-3 rounded-full border border-current"
            style={{ backgroundColor: "transparent" }}
          />
        </button>

        <ProfileSection
          profile={profile}
          isPending={isPending}
          portfolioRef={linkRefs.portfolioRef}
          zephyrRef={linkRefs.zephyrRef}
          singularityRef={linkRefs.singularityRef}
        />

        <div>
          <h3 className="mb-2 text-base font-medium">work stuff i guess</h3>
        </div>

        <ExperienceSection experience={experience} isPending={isPending} />

        <Projects onExpanded={setIsProjectsExpanded} />

        <GitHubActivity username="parazeeknova" isDarkMode={isDarkMode} />

        <GitHubStats username="parazeeknova" />

        <div
          className="absolute bottom-4 left-4 flex space-x-6 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8"
          style={isMobile && isProjectsExpanded ? { display: "none" } : undefined}
        >
          <SocialLinks
            profile={profile}
            githubRef={linkRefs.githubRef}
            linkedinRef={linkRefs.linkedinRef}
            twitterRef={linkRefs.twitterRef}
          />
        </div>
      </div>

      <div ref={rightPanelRef} className="relative" style={{ backgroundColor: "#000000" }} />
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Home,
});
