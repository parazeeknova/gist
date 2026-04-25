import { useRef, useState, useEffect } from "react";
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

interface MobileProjectListProps {
  isDarkMode?: boolean;
}

export const MobileProjectList = ({ isDarkMode = true }: MobileProjectListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: projectData, isPending } = useProjects();
  const panelBg = isDarkMode ? "#000000" : "#ffffff";

  const visibleProjects = isExpanded ? projectData : projectData?.slice(0, 3);

  return (
    <div>
      {isExpanded ? (
        <>
          <div className="space-y-3 sm:space-y-4">
            {isPending ? (
              <LoadingDots />
            ) : (
              visibleProjects?.map((project) => (
                <div key={project.title}>
                  <h3 className="text-xs font-medium sm:text-sm">{project.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">{project.desc}</p>
                  <p className="mt-1 text-xs text-gray-400">{project.stack}</p>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="link-underline mt-1 text-xs text-gray-400"
          >
            view less
          </button>
        </>
      ) : (
        <button className="w-full text-left" onClick={() => setIsExpanded(true)}>
          <div className="relative space-y-3 sm:space-y-4">
            {isPending ? (
              <LoadingDots />
            ) : (
              visibleProjects?.map((project) => (
                <div key={project.title}>
                  <h3 className="text-xs font-medium sm:text-sm">{project.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">{project.desc}</p>
                  <p className="mt-1 text-xs text-gray-400">{project.stack}</p>
                </div>
              ))
            )}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
              style={{
                background: `linear-gradient(to top, ${panelBg} 0%, transparent 100%)`,
              }}
            />
          </div>
          <span className="link-underline mt-1 block text-xs text-gray-400">view more</span>
        </button>
      )}
    </div>
  );
};

interface ProjectsProps {
  onExpanded?: (expanded: boolean) => void;
}

export default function Projects({ onExpanded }: ProjectsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const projectsButtonRef = useRef<HTMLButtonElement>(null);
  const projectsContentRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
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
  );
}
