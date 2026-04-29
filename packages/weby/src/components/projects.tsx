import { useState } from "react";
import { useProjects } from "../hooks/use-data";
import type { Project } from "../types";
import { LoadingDots } from "./loading";

interface ProjectCardProps {
  onDetail?: (project: Project) => void;
  project: Project;
}

const ProjectCard = ({ onDetail, project }: ProjectCardProps) => (
  <div>
    <div className="flex items-center gap-2">
      <h3 className="font-medium text-xs sm:text-sm">{project.title}</h3>
      {project.readmeUrl && onDetail ? (
        <button
          className="text-gray-400 text-[11px] lowercase hover:text-gray-300 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onDetail(project);
          }}
          type="button"
        >
          detail
        </button>
      ) : null}
    </div>
    <p className="mt-1 text-gray-500 text-xs sm:text-sm">{project.desc}</p>
    <p className="mt-1 text-gray-400 text-xs">{project.stack}</p>
  </div>
);

interface ProjectListProps {
  onDetail?: (project: Project) => void;
}

export const ProjectList = ({ onDetail }: ProjectListProps) => {
  const { data: projectData, isPending } = useProjects();

  return (
    <div className="space-y-3 sm:space-y-4">
      {isPending ? (
        <LoadingDots />
      ) : (
        projectData?.map((project) => (
          <ProjectCard key={project.title} onDetail={onDetail} project={project} />
        ))
      )}
    </div>
  );
};

interface MobileProjectListProps {
  onDetail?: (project: Project) => void;
}

export const MobileProjectList = ({ onDetail }: MobileProjectListProps) => {
  const { data: projectData, isPending } = useProjects();
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
                <ProjectCard key={project.title} onDetail={onDetail} project={project} />
              ))
            )}
          </div>
          <button
            className="link-underline mt-1 text-gray-400 text-xs"
            onClick={() => setIsExpanded(false)}
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
                <ProjectCard key={project.title} onDetail={onDetail} project={project} />
              ))
            )}
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 h-16"
              style={{
                background: `linear-gradient(to top, var(--fade-color) 0%, transparent 100%)`,
              }}
            />
          </div>
          <span className="link-underline mt-1 block text-gray-400 text-xs">view more</span>
        </button>
      )}
    </div>
  );
};
