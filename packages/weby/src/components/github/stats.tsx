import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LoadingDots } from "../loading";

export interface GitHubOrg {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubStatsData {
  commitsThisMonth: number;
  commitsLastYear: number;
  prsThisMonth: number;
  orgs: GitHubOrg[];
}

// Create a single NumberFormat instance for consistent formatting
const numberFormatter = new Intl.NumberFormat("en-US");

// Component for org avatar with error handling
interface OrgAvatarProps {
  org: GitHubOrg;
}

const OrgAvatar = ({ org }: OrgAvatarProps) => {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      className="flex items-center space-x-1.5"
      href={org.html_url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="text-[10px] font-medium sm:text-xs">{org.login}</span>
      {imgError ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[8px] text-gray-600 sm:h-5 sm:w-5 sm:text-[10px]">
          {org.login.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <img
          alt={org.login}
          className="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
          loading="lazy"
          onError={() => setImgError(true)}
          src={org.avatar_url}
        />
      )}
    </a>
  );
};

const useGitHubStats = () =>
  useQuery<GitHubStatsData>({
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/github/stats", { signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<GitHubStatsData>;
    },
    queryKey: ["github-stats"],
    staleTime: 1000 * 60 * 60,
  });

export const GitHubStats = () => {
  const { data, isPending, isError, error } = useGitHubStats();

  if (isPending) {
    return (
      <div className="mt-4 sm:mt-6">
        <LoadingDots />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-4 sm:mt-6">
        <p className="text-gray-500 text-xs">
          Failed to load GitHub stats: {error?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      desktopLabel: "commits this month",
      mobileLabel: "this month",
      value: data.commitsThisMonth ?? 0,
    },
    {
      desktopLabel: "commits last year",
      mobileLabel: "commits (1y)",
      value: data.commitsLastYear ?? 0,
    },
    {
      desktopLabel: "pull requests this month",
      mobileLabel: "prs this mo",
      value: data.prsThisMonth ?? 0,
    },
  ];

  return (
    <div className="mt-4 sm:mt-6">
      <div className="flex space-x-6">
        {stats.map((stat) => (
          <div className="flex flex-col" key={stat.desktopLabel}>
            <span className="font-medium text-xs tabular-nums sm:text-sm">
              {numberFormatter.format(stat.value)}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider sm:text-xs">
              <span className="sm:hidden">{stat.mobileLabel}</span>
              <span className="hidden sm:inline">{stat.desktopLabel}</span>
            </span>
          </div>
        ))}
      </div>

      {data.orgs && data.orgs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider sm:text-xs">
            orgs
          </span>
          {data.orgs.map((org) => (
            <OrgAvatar key={org.login} org={org} />
          ))}
        </div>
      )}
    </div>
  );
};
