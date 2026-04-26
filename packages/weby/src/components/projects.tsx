import { useState } from "react";
import { useProjects } from "../hooks/use-data";
import { LoadingDots } from "./loading";
import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => (
  <div>
    <h3 className="text-xs font-medium sm:text-sm">{project.title}</h3>
    <p className="mt-1 text-xs text-gray-500 sm:text-sm">{project.desc}</p>
    <p className="mt-1 text-xs text-gray-400">{project.stack}</p>
  </div>
);

export const ProjectList = () => {
  const { data: projectData, isPending } = useProjects();

  return (
    <div className="space-y-3 sm:space-y-4">
      {isPending ? (
        <LoadingDots />
      ) : (
        projectData?.map((project) => <ProjectCard key={project.title} project={project} />)
      )}
    </div>
  );
};

interface MobileProjectListProps {
  isDarkMode?: boolean;
}

export const MobileProjectList = ({ isDarkMode = true }: MobileProjectListProps) => {
  const { data: projectData, isPending } = useProjects();
  const panelBg = isDarkMode ? "#000000" : "#ffffff";
  const [isExpanded, setIsExpanded] = useState(false);

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
                <ProjectCard key={project.title} project={project} />
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
                <ProjectCard key={project.title} project={project} />
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
