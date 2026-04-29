import { useState } from "react";
import { useProjects } from "../hooks/use-data";
import type { Project } from "#/types";
import { LoadingDots } from "./loading";

interface ProjectCardProps {
  onDetail?: (project: Project) => void;
  project: Project;
}

const ProjectCard = ({ onDetail, project }: ProjectCardProps) => {
  const [stackOpen, setStackOpen] = useState(false);

  return (
    <div>
      <h3 className="font-medium text-xs sm:text-sm">{project.title}</h3>
      <p className="mt-1 text-gray-500 text-xs sm:text-sm">{project.desc}</p>
      <p className="mt-1 flex items-center gap-2 text-gray-400 text-xs">
        {stackOpen ? (
          <>
            {project.stack}{" "}
            <button
              className="text-gray-500 text-[11px] lowercase hover:text-gray-300 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setStackOpen(false);
              }}
              type="button"
            >
              collapse
            </button>
          </>
        ) : (
          <>
            <button
              className="text-gray-500 text-[11px] lowercase hover:text-gray-300 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setStackOpen(true);
              }}
              type="button"
            >
              stack
            </button>
            {project.readmeUrl && onDetail ? (
              <button
                className="text-[#b58cff] text-[11px] lowercase hover:opacity-70 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetail(project);
                }}
                type="button"
              >
                detail
              </button>
            ) : null}
            {project.repoUrl && (
              <a
                className="text-[#b58cff] text-[11px] lowercase hover:opacity-70"
                href={project.repoUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                repo
              </a>
            )}
            {project.productUrl && (
              <a
                className="text-[#b58cff] text-[11px] lowercase hover:opacity-70"
                href={project.productUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                product
              </a>
            )}
          </>
        )}
      </p>
    </div>
  );
};

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
        <div
          className="w-full text-left"
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- this div wraps interactive children that include <button> elements, so a native <button> cannot be used here
          onClick={() => setIsExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsExpanded(true);
            }
          }}
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- same reason as above, native <button> would nest other <button>s
          role="button"
          tabIndex={0}
        >
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
        </div>
      )}
    </div>
  );
};
