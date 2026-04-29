import { createFileRoute } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GitHubActivity } from "../components/github-calendar";
import { GitHubStats } from "../components/github-stats";
import { ExperienceSection, ProfileSection, SocialLinks } from "../components/home-sections";
import { MobileProjectList, ProjectList } from "../components/projects";
import { ScrollContainer } from "../components/scroll-container";
import { BlogReaderPanel } from "../components/blog/blog-reader-panel";
import { LoginPopup } from "../components/login-popup";
import { ReadmeViewer } from "../components/readme-viewer";
import { useExperience, useIsFetchingData, useProfile, useProjects } from "../hooks/use-data";

const useIsMobile = (): boolean => {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < 1024;
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  // eslint-disable-next-line promise/prefer-await-to-callbacks -- useSyncExternalStore requires callback pattern
  const subscribe = useCallback((callback: () => void) => {
    // eslint-disable-next-line promise/prefer-await-to-callbacks -- event handler callback required
    const handleResize = () => callback();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

interface LinkRefs {
  githubRef: React.RefObject<HTMLAnchorElement | null>;
  linkedinRef: React.RefObject<HTMLAnchorElement | null>;
  portfolioRef: React.RefObject<HTMLAnchorElement | null>;
  singularityRef: React.RefObject<HTMLAnchorElement | null>;
  twitterRef: React.RefObject<HTMLAnchorElement | null>;
  zephyrRef: React.RefObject<HTMLAnchorElement | null>;
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
        {
          "--underline-width": "100%",
          duration: 0.3,
          ease: "power2.out",
        } as gsap.TweenVars,
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

  return {
    githubRef,
    linkedinRef,
    portfolioRef,
    singularityRef,
    twitterRef,
    zephyrRef,
  };
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
    if (!(themeButton && themeIndicator)) {
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

const Home = function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileView, setMobileView] = useState<"about" | "blogs">("about");
  const [selectedProject, setSelectedProject] = useState<{
    readmeUrl: string;
    title: string;
  } | null>(null);
  const isMobile = useIsMobile();

  const linkRefs = useAnimatedLinks();
  const themeRefs = useThemeButtonHover();
  const themeRefsRight = useThemeButtonHover();

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useProfile();
  const { data: experience } = useExperience();
  const { data: projects } = useProjects();
  const isPending = useIsFetchingData();

  // Read initial theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light") {
        setIsDarkMode(false);
      } else {
        setIsDarkMode(true);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  }, [isDarkMode]);

  const handleProjectDetail = useCallback(
    (project: { readmeUrl?: string; title: string }) => {
      if (!project.readmeUrl) {
        return;
      }
      setSelectedProject({ readmeUrl: project.readmeUrl, title: project.title });
      if (isMobile) {
        setMobileView("blogs");
      }
    },
    [isMobile],
  );

  // Extract GitHub username from profile or env
  const githubUsername = (() => {
    const url = profile?.links?.github?.url;
    if (url) {
      const match = url.match(/github\.com\/([^/]+)/);
      if (match) {
        return match[1];
      }
    }
    return "parazeeknova";
  })();

  let rightPanelVisibility: string;
  if (isMobile) {
    rightPanelVisibility = mobileView === "blogs" ? "h-screen overflow-hidden" : "hidden";
  } else {
    rightPanelVisibility = "min-h-0 overflow-hidden lg:border-l";
  }

  return (
    <div
      className="relative grid min-h-screen grid-cols-1 overflow-hidden lg:h-screen lg:grid-cols-2"
      ref={mainContainerRef}
    >
      <div
        data-theme={isDarkMode ? "dark" : "light"}
        className={`relative z-10 flex select-none flex-col gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:overflow-hidden lg:p-8 ${
          isDarkMode ? "bg-bg-dark text-text-dark" : "bg-bg-light text-text-light"
        } ${isMobile && mobileView !== "about" ? "hidden" : ""}`}
        ref={leftPanelRef}
      >
        <div className="absolute top-4 right-4 flex items-center gap-3 sm:top-6 sm:right-6 lg:top-8 lg:right-8">
          {isMobile && (
            <button
              className={`text-[13px] lowercase focus:outline-none hover:opacity-70 ${
                isDarkMode ? "text-text-dark/60" : "text-text-light/60"
              }`}
              onClick={() => setMobileView("blogs")}
            >
              blogs
            </button>
          )}
          <button
            aria-label="Toggle theme"
            className="rounded-full p-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-current/40"
            onClick={toggleTheme}
            ref={themeRefs.buttonRef}
          >
            <span className="sr-only">Toggle theme</span>
            <span
              className="block h-3 w-3 rounded-full border border-current"
              ref={themeRefs.indicatorRef}
              style={{ backgroundColor: "transparent" }}
            />
          </button>
        </div>

        <ProfileSection
          isMobile={isMobile}
          isPending={isPending}
          portfolioRef={linkRefs.portfolioRef}
          profile={profile}
          singularityRef={linkRefs.singularityRef}
          zephyrRef={linkRefs.zephyrRef}
        />

        <div className="shrink-0 space-y-2">
          <h3 className="font-medium text-base">work stuff i guess</h3>
          <ExperienceSection experience={experience} isPending={isPending} />
        </div>

        {isMobile ? (
          <div className="shrink-0 space-y-2">
            <h3 className="font-medium text-base">voo look what i made</h3>
            <MobileProjectList onDetail={handleProjectDetail} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <h3 className="mb-2 shrink-0 font-medium text-base">voo look what i made</h3>
            <ScrollContainer className="min-h-0 flex-1">
              <ProjectList onDetail={handleProjectDetail} />
            </ScrollContainer>
          </div>
        )}

        <div className="shrink-0 overflow-x-auto">
          <GitHubActivity isDarkMode={isDarkMode} username={githubUsername} />
          <GitHubStats />
        </div>

        <div className="shrink-0 flex items-center justify-between">
          <SocialLinks
            githubRef={linkRefs.githubRef}
            linkedinRef={linkRefs.linkedinRef}
            profile={profile}
            twitterRef={linkRefs.twitterRef}
          />
          <LoginPopup isDarkMode={isDarkMode} />
        </div>
      </div>

      <div
        data-theme={isDarkMode ? "dark" : "light"}
        className={`relative ${rightPanelVisibility} ${
          isDarkMode
            ? "border-border-dark bg-bg-dark text-text-dark"
            : "border-border-light bg-bg-light text-text-light"
        }`}
        ref={rightPanelRef}
      >
        {selectedProject ? (
          <ReadmeViewer
            isDarkMode={isDarkMode}
            isMobile={isMobile}
            onBack={() => setSelectedProject(null)}
            onSelectPost={() => setSelectedProject(null)}
            onSelectProject={handleProjectDetail}
            onSwitchToAbout={() => setMobileView("about")}
            onToggleTheme={toggleTheme}
            projectTitle={selectedProject.title}
            projects={projects}
            readmeUrl={selectedProject.readmeUrl}
            themeButtonRef={themeRefsRight.buttonRef as React.RefObject<HTMLButtonElement | null>}
            themeIndicatorRef={
              themeRefsRight.indicatorRef as React.RefObject<HTMLSpanElement | null>
            }
          />
        ) : (
          <BlogReaderPanel
            isDarkMode={isDarkMode}
            isMobile={isMobile}
            onSelectProject={handleProjectDetail}
            onSwitchToAbout={() => setMobileView("about")}
            onToggleTheme={toggleTheme}
            projects={projects}
            slug="crdts-101-a-primer"
            themeButtonRef={themeRefsRight.buttonRef as React.RefObject<HTMLButtonElement | null>}
            themeIndicatorRef={
              themeRefsRight.indicatorRef as React.RefObject<HTMLSpanElement | null>
            }
          />
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Home,
});
