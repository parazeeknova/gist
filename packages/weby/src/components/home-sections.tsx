import { useMemo, useState } from "react";
import type { ExperienceItem, Link, Profile } from "#/types";
import { AnimatedLink } from "./animated-link";
import { LoadingDots } from "./loading";
import { markdownToHtml } from "../lib/markdown-to-html";

const getLink = (links: Record<string, Link> | undefined, key: string): Link | undefined =>
  links?.[key];

interface ProfileSectionProps {
  isMobile?: boolean;
  isPending?: boolean;
  profile: Profile | undefined;
}

export const ProfileSection = ({ profile, isPending, isMobile }: ProfileSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const portfolio = getLink(profile?.links, "portfolio");

  const descriptionHtml = useMemo(
    () => (profile?.description ? markdownToHtml(profile.description) : ""),
    [profile?.description],
  );

  let description: React.ReactNode = null;
  if (isPending) {
    description = <LoadingDots />;
  } else if (descriptionHtml) {
    description = (
      <span className="prose-desc" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
    );
  }

  return (
    <div className="shrink-0">
      {profile?.name && (
        <h1 className="font-normal text-xl sm:text-2xl">
          {profile.name}
          {profile.username && <span className="ml-2 text-sm opacity-50">@{profile.username}</span>}
        </h1>
      )}

      {(portfolio || profile?.email) && (
        <p className="mb-6 text-sm sm:mb-8 sm:text-base">
          {portfolio && (
            <AnimatedLink href={portfolio.url} rel="noopener noreferrer" target="_blank">
              {portfolio.label}
            </AnimatedLink>
          )}
          {portfolio && profile?.email && " · "}
          {profile?.email && (
            <AnimatedLink href={`mailto:${profile.email}`} rel="noopener noreferrer">
              {profile.email}
            </AnimatedLink>
          )}
        </p>
      )}

      {description && (
        <>
          {isMobile ? (
            <div>
              {isExpanded ? (
                <>
                  <p className="text-sm leading-relaxed">{description}</p>
                  <button
                    className="link-underline mt-1 text-gray-400 text-xs"
                    onClick={() => setIsExpanded(false)}
                    type="button"
                  >
                    view less
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left"
                  onClick={() => setIsExpanded(true)}
                  type="button"
                >
                  <div className="relative max-h-24 overflow-hidden text-sm leading-relaxed">
                    {description}
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
          ) : (
            <p className="text-sm leading-relaxed sm:text-base">{description}</p>
          )}
        </>
      )}
    </div>
  );
};

interface ExperienceSectionProps {
  experience: ExperienceItem[] | undefined;
  isPending?: boolean;
}

export const ExperienceSection = ({ experience, isPending }: ExperienceSectionProps) => {
  if (isPending) {
    return (
      <div className="shrink-0 space-y-3 sm:space-y-4">
        <LoadingDots />
      </div>
    );
  }

  if (!experience || experience.length === 0) {
    return null;
  }

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
};

interface SocialLinksProps {
  profile: Profile | undefined;
}

export const SocialLinks = ({ profile }: SocialLinksProps) => {
  const github = getLink(profile?.links, "github");
  const linkedin = getLink(profile?.links, "linkedin");
  const twitter = getLink(profile?.links, "twitter");

  return (
    <div className="flex space-x-6">
      {github?.url && (
        <AnimatedLink href={github.url} rel="noopener noreferrer" target="_blank">
          {github.label}
        </AnimatedLink>
      )}
      {linkedin?.url && (
        <AnimatedLink href={linkedin.url} rel="noopener noreferrer" target="_blank">
          {linkedin.label}
        </AnimatedLink>
      )}
      {twitter?.url && (
        <AnimatedLink href={twitter.url} rel="noopener noreferrer" target="_blank">
          {twitter.label}
        </AnimatedLink>
      )}
      {profile?.email && (
        <AnimatedLink href={`mailto:${profile.email}`} rel="noopener noreferrer">
          email
        </AnimatedLink>
      )}
    </div>
  );
};
