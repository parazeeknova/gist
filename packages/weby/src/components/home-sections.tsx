import { useState } from "react";
import type { Profile, ExperienceItem, Link } from "../types";
import { LoadingDots } from "./loading";

// Helper to safely get a link from the flexible links record
const getLink = (links: Record<string, Link> | undefined, key: string): Link | undefined =>
  links?.[key];

interface ProfileSectionProps {
  profile: Profile | undefined;
  portfolioRef: React.RefObject<HTMLAnchorElement | null>;
  zephyrRef: React.RefObject<HTMLAnchorElement | null>;
  singularityRef: React.RefObject<HTMLAnchorElement | null>;
  isPending?: boolean;
  isMobile?: boolean;
  isDarkMode?: boolean;
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
            ref={zephyrRef}
            href={zephyr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline"
          >
            {zephyr.label}
          </a>
          . Runs{" "}
          <a
            ref={singularityRef}
            href={singularity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline"
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
      <h1 className="text-xl font-normal sm:text-2xl">
        {isPending ? <LoadingDots /> : (profile?.name ?? "Harsh Sahu")}
      </h1>
      <p className="mb-6 text-sm sm:mb-8 sm:text-base">
        <a
          ref={portfolioRef}
          href={portfolio?.url ?? "https://folio.zephyyrr.in"}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline"
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
                onClick={() => setIsExpanded(false)}
                className="link-underline mt-1 text-xs text-gray-400"
              >
                view less
              </button>
            </>
          ) : (
            <button className="w-full text-left" onClick={() => setIsExpanded(true)}>
              <div className="relative max-h-24 overflow-hidden text-sm leading-relaxed">
                {description}
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
      <h3 className="text-xs font-medium sm:text-sm">Co-Founder — Singularity Works</h3>
      <p className="text-xs text-gray-500 sm:text-sm">
        On-Site (Bhopal, India) | August 2025–Present
      </p>
    </div>
    <div>
      <h3 className="text-xs font-medium sm:text-sm">Full Stack Developer Intern — amasQIS.ai</h3>
      <p className="text-xs text-gray-500 sm:text-sm">Remote (Muscat, Oman) | April 2025–Present</p>
    </div>
    <div>
      <h3 className="text-xs font-medium sm:text-sm">President — Mozilla Firefox Club</h3>
      <p className="text-xs text-gray-500 sm:text-sm">
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
            <h3 className="text-xs font-medium sm:text-sm">{item.title}</h3>
            <p className="text-xs text-gray-500 sm:text-sm">
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
  profile: Profile | undefined;
  githubRef: React.RefObject<HTMLAnchorElement | null>;
  linkedinRef: React.RefObject<HTMLAnchorElement | null>;
  twitterRef: React.RefObject<HTMLAnchorElement | null>;
}

export const SocialLinks = ({ profile, githubRef, linkedinRef, twitterRef }: SocialLinksProps) => {
  const github = getLink(profile?.links, "github");
  const linkedin = getLink(profile?.links, "linkedin");
  const twitter = getLink(profile?.links, "twitter");

  return (
    <div className="flex space-x-6">
      <a
        ref={githubRef}
        href={github?.url ?? "https://github.com/parazeeknova"}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline text-xs sm:text-sm"
        aria-label="GitHub"
      >
        {github?.label ?? "GitHub"}
      </a>
      <a
        ref={linkedinRef}
        href={linkedin?.url ?? "https://www.linkedin.com/in/hashk"}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline text-xs sm:text-sm"
        aria-label="LinkedIn"
      >
        {linkedin?.label ?? "LinkedIn"}
      </a>
      <a
        ref={twitterRef}
        href={twitter?.url ?? "https://x.com/hashcodes_"}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline text-xs sm:text-sm"
        aria-label="X"
      >
        {twitter?.label ?? "X"}
      </a>
    </div>
  );
};
