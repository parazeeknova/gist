import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { useProjects } from "../hooks/use-data";
import { LoadingDots } from "./loading";

export const ProjectList = () => {
  const { data: projectData, isPending } = useProjects();

  return (
    <div className="space-y-3 sm:space-y-4">
      {isPending ? (
        <LoadingDots />
      ) : (
        projectData?.map((project) => (
          <div key={project.title}>
            <h3 className="text-xs font-medium sm:text-sm">{project.title}</h3>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">{project.desc}</p>
            <p className="mt-1 text-xs text-gray-400">{project.stack}</p>
          </div>
        ))
      )}
    </div>
  );
};

interface ProjectsProps {
  onExpanded?: (expanded: boolean) => void;
}

export default function Projects({ onExpanded }: ProjectsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const projectsButtonRef = useRef<HTMLButtonElement>(null);
  const projectsContentRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const initProjectsAnimation = useCallback(() => {
    const btn = projectsButtonRef.current;
    if (!btn || timelineRef.current) {
      return;
    }
    gsap.set(btn, { "--underline-width": "0%" } as gsap.TweenVars);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      btn,
      { "--underline-width": "0%" } as gsap.TweenVars,
      { "--underline-width": "100%", duration: 0.4, ease: "power2.out" } as gsap.TweenVars,
    );
    timelineRef.current = tl;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsExpanded(!mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    initProjectsAnimation();
    return () => window.removeEventListener("resize", checkMobile);
  }, [initProjectsAnimation]);

  useEffect(() => {
    if (timelineRef.current && projectsContentRef.current) {
      if (isExpanded) {
        timelineRef.current.play();
        gsap.fromTo(
          projectsContentRef.current,
          { opacity: 0, y: -10 },
          { duration: 0.3, ease: "power2.out", opacity: 1, y: 0 },
        );
      } else {
        timelineRef.current.reverse();
        gsap.to(projectsContentRef.current, {
          duration: 0.2,
          ease: "power2.in",
          opacity: 0,
          y: -10,
        });
      }
    }
  }, [isExpanded]);

  useEffect(() => {
    onExpanded?.(isExpanded);
  }, [isExpanded, onExpanded]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {isMobile ? (
        <div>
          <button
            ref={projectsButtonRef}
            className="projects-link text-base font-medium"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <span>voo look what i made</span>
          </button>
          {isExpanded && (
            <div ref={projectsContentRef} className="mt-3 space-y-4">
              <ProjectList />
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 className="mb-2 text-base font-medium">voo look what i made</h3>
          <ProjectList />
        </div>
      )}
    </div>
  );
}
