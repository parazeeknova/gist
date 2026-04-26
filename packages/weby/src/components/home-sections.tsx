import { useState } from "react";
import type { ExperienceItem, Link, Profile } from "../types";
import { LoadingDots } from "./loading";

// Helper to safely get a link from the flexible links record
const getLink = (links: Record<string, Link> | undefined, key: string): Link | undefined =>
  links?.[key];

interface ProfileSectionProps {
  isDarkMode?: boolean;
  isMobile?: boolean;
  isPending?: boolean;
  portfolioRef: React.RefObject<HTMLAnchorElement | null>;
  profile: Profile | undefined;
  singularityRef: React.RefObject<HTMLAnchorElement | null>;
  zephyrRef: React.RefObject<HTMLAnchorElement | null>;
}

export const ProfileSection = ({
  profile,
  portfolioRef,
  zephyrRef,
  singularityRef,
  isPending,
  isMobile,
  isDarkMode = true,
}: ProfileSectionProps) => {
  const panelBg = isDarkMode ? "#000000" : "#ffffff";
  const [isExpanded, setIsExpanded] = useState(false);

  const zephyr = getLink(profile?.links, "zephyr");
  const singularity = getLink(profile?.links, "singularity");
  const portfolio = getLink(profile?.links, "portfolio");

  const description = isPending ? (
    <LoadingDots />
  ) : (
    <>
      {profile?.description ??
        "Engineer and founder, building web platforms, infrastructure, and tools."}
      {zephyr && singularity && (
        <>
          {" "}
          Creator of{" "}
          <a
            className="link-underline"
            href={zephyr.url}
            ref={zephyrRef}
            rel="noopener noreferrer"
            target="_blank"
          >
            {zephyr.label}
          </a>
          . Runs{" "}
          <a
            className="link-underline"
            href={singularity.url}
            ref={singularityRef}
            rel="noopener noreferrer"
            target="_blank"
          >
            {singularity.label}
          </a>
          , a freelance design and development studio. CS undergrad, active in open-source and
          hackathons.
        </>
      )}
    </>
  );

  return (
    <div className="shrink-0">
      <h1 className="font-normal text-xl sm:text-2xl">
        {isPending ? <LoadingDots /> : (profile?.name ?? "Harsh Sahu")}
      </h1>
      <p className="mb-6 text-sm sm:mb-8 sm:text-base">
        <a
          className="link-underline"
          href={portfolio?.url ?? "https://folio.zephyyrr.in"}
          ref={portfolioRef}
          rel="noopener noreferrer"
          target="_blank"
        >
          {portfolio?.label ?? "designer portfolio"}
          <span className="ml-1">↗</span>
        </a>
      </p>

      {isMobile ? (
        <div>
          {isExpanded ? (
            <>
              <p className="text-sm leading-relaxed">{description}</p>
              <button
                className="link-underline mt-1 text-gray-400 text-xs"
                onClick={() => setIsExpanded(false)}
              >
                view less
              </button>
            </>
          ) : (
            <button className="w-full text-left" onClick={() => setIsExpanded(true)}>
              <div className="relative max-h-24 overflow-hidden text-sm leading-relaxed">
                {description}
                <div
                  className="pointer-events-none absolute right-0 bottom-0 left-0 h-16"
                  style={{
                    background: `linear-gradient(to top, ${panelBg} 0%, transparent 100%)`,
                  }}
                />
              </div>
              <span className="link-underline mt-1 block text-gray-400 text-xs">view more</span>
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm leading-relaxed sm:text-base">{description}</p>
      )}
    </div>
  );
};

interface ExperienceSectionProps {
  experience: ExperienceItem[] | undefined;
  isPending?: boolean;
}

const ExperienceFallback = () => (
  <>
    <div>
      <h3 className="font-medium text-xs sm:text-sm">Co-Founder — Singularity Works</h3>
      <p className="text-gray-500 text-xs sm:text-sm">
        On-Site (Bhopal, India) | August 2025–Present
      </p>
    </div>
    <div>
      <h3 className="font-medium text-xs sm:text-sm">Full Stack Developer Intern — amasQIS.ai</h3>
      <p className="text-gray-500 text-xs sm:text-sm">Remote (Muscat, Oman) | April 2025–Present</p>
    </div>
    <div>
      <h3 className="font-medium text-xs sm:text-sm">President — Mozilla Firefox Club</h3>
      <p className="text-gray-500 text-xs sm:text-sm">
        On-Site (Bhopal, India) | June 2025–Present
      </p>
    </div>
  </>
);

export const ExperienceSection = ({ experience, isPending }: ExperienceSectionProps) => {
  if (isPending) {
    return (
      <div className="shrink-0 space-y-3 sm:space-y-4">
        <LoadingDots />
      </div>
    );
  }

  if (experience && experience.length > 0) {
    return (
      <div className="shrink-0 space-y-3 sm:space-y-4">
        {experience.map((item) => (
          <div key={item.title}>
            <h3 className="font-medium text-xs sm:text-sm">{item.title}</h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              {item.location} | {item.period}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-3 sm:space-y-4">
      <ExperienceFallback />
    </div>
  );
};

interface SocialLinksProps {
  githubRef: React.RefObject<HTMLAnchorElement | null>;
  linkedinRef: React.RefObject<HTMLAnchorElement | null>;
  profile: Profile | undefined;
  twitterRef: React.RefObject<HTMLAnchorElement | null>;
}

export const SocialLinks = ({ profile, githubRef, linkedinRef, twitterRef }: SocialLinksProps) => {
  const github = getLink(profile?.links, "github");
  const linkedin = getLink(profile?.links, "linkedin");
  const twitter = getLink(profile?.links, "twitter");

  return (
    <div className="flex space-x-6">
      <a
        aria-label="GitHub"
        className="link-underline text-xs sm:text-sm"
        href={github?.url ?? "https://github.com/parazeeknova"}
        ref={githubRef}
        rel="noopener noreferrer"
        target="_blank"
      >
        {github?.label ?? "GitHub"}
      </a>
      <a
        aria-label="LinkedIn"
        className="link-underline text-xs sm:text-sm"
        href={linkedin?.url ?? "https://www.linkedin.com/in/hashk"}
        ref={linkedinRef}
        rel="noopener noreferrer"
        target="_blank"
      >
        {linkedin?.label ?? "LinkedIn"}
      </a>
      <a
        aria-label="X"
        className="link-underline text-xs sm:text-sm"
        href={twitter?.url ?? "https://x.com/parazeeknova"}
        ref={twitterRef}
        rel="noopener noreferrer"
        target="_blank"
      >
        {twitter?.label ?? "X"}
      </a>
    </div>
  );
};
