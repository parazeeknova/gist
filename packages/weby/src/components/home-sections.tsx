import type { Profile, ExperienceItem } from "../types";
import { LoadingDots } from "./loading";

interface ProfileSectionProps {
  profile: Profile | undefined;
  portfolioRef: React.RefObject<HTMLAnchorElement | null>;
  zephyrRef: React.RefObject<HTMLAnchorElement | null>;
  singularityRef: React.RefObject<HTMLAnchorElement | null>;
  isPending?: boolean;
}

export const ProfileSection = ({
  profile,
  portfolioRef,
  zephyrRef,
  singularityRef,
  isPending,
}: ProfileSectionProps) => (
  <div className="shrink-0">
    <h1 className="text-xl font-normal sm:text-2xl">
      {isPending ? <LoadingDots /> : (profile?.name ?? "Harsh Sahu")}
    </h1>
    <p className="mb-6 text-sm sm:mb-8 sm:text-base">
      <a
        ref={portfolioRef}
        href={profile?.links.portfolio.url ?? "https://folio.zephyyrr.in"}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline"
      >
        {profile?.links.portfolio.label ?? "designer portfolio"}
        <span className="ml-1">↗</span>
      </a>
    </p>
    <p className="text-sm leading-relaxed sm:text-base">
      {isPending ? (
        <LoadingDots />
      ) : (
        <>
          {profile?.description ??
            "Engineer and founder, building web platforms, infrastructure, and tools."}
          {profile && (
            <>
              {" "}
              Creator of{" "}
              <a
                ref={zephyrRef}
                href={profile.links.zephyr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {profile.links.zephyr.label}
              </a>
              . Runs{" "}
              <a
                ref={singularityRef}
                href={profile.links.singularity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {profile.links.singularity.label}
              </a>
              , a freelance design and development studio. CS undergrad, active in open-source and
              hackathons.
            </>
          )}
        </>
      )}
    </p>
  </div>
);

interface ExperienceSectionProps {
  experience: ExperienceItem[] | undefined;
  isPending?: boolean;
}

export const ExperienceSection = ({ experience, isPending }: ExperienceSectionProps) => (
  <div className="shrink-0 space-y-3 sm:space-y-4">
    {isPending ? (
      <LoadingDots />
    ) : (
      (experience?.map((item) => (
        <div key={item.title}>
          <h3 className="text-xs font-medium sm:text-sm">{item.title}</h3>
          <p className="text-xs text-gray-500 sm:text-sm">
            {item.location} | {item.period}
          </p>
        </div>
      )) ?? (
        <>
          <div>
            <h3 className="text-xs font-medium sm:text-sm">Co-Founder — Singularity Works</h3>
            <p className="text-xs text-gray-500 sm:text-sm">
              On-Site (Bhopal, India) | August 2025–Present
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium sm:text-sm">
              Full Stack Developer Intern — amasQIS.ai
            </h3>
            <p className="text-xs text-gray-500 sm:text-sm">
              Remote (Muscat, Oman) | April 2025–Present
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium sm:text-sm">President — Mozilla Firefox Club</h3>
            <p className="text-xs text-gray-500 sm:text-sm">
              On-Site (Bhopal, India) | June 2025–Present
            </p>
          </div>
        </>
      ))
    )}
  </div>
);

interface SocialLinksProps {
  profile: Profile | undefined;
  githubRef: React.RefObject<HTMLAnchorElement | null>;
  linkedinRef: React.RefObject<HTMLAnchorElement | null>;
  twitterRef: React.RefObject<HTMLAnchorElement | null>;
}

export const SocialLinks = ({ profile, githubRef, linkedinRef, twitterRef }: SocialLinksProps) => (
  <div className="flex space-x-6">
    <a
      ref={githubRef}
      href={profile?.links.github.url ?? "https://github.com/parazeeknova"}
      target="_blank"
      rel="noopener noreferrer"
      className="link-underline text-xs sm:text-sm"
      aria-label="GitHub"
    >
      {profile?.links.github.label ?? "GitHub"}
    </a>
    <a
      ref={linkedinRef}
      href={profile?.links.linkedin.url ?? "https://www.linkedin.com/in/hashk"}
      target="_blank"
      rel="noopener noreferrer"
      className="link-underline text-xs sm:text-sm"
      aria-label="LinkedIn"
    >
      {profile?.links.linkedin.label ?? "LinkedIn"}
    </a>
    <a
      ref={twitterRef}
      href={profile?.links.twitter.url ?? "https://x.com/hashcodes_"}
      target="_blank"
      rel="noopener noreferrer"
      className="link-underline text-xs sm:text-sm"
      aria-label="X"
    >
      {profile?.links.twitter.label ?? "X"}
    </a>
  </div>
);
