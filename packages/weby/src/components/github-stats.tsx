import { useQuery } from "@tanstack/react-query";

interface GitHubOrg {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubStats {
  commitsThisMonth: number;
  totalCommits: number;
  prsThisMonth: number;
  orgs: GitHubOrg[];
}

const useGitHubStats = () =>
  useQuery<GitHubStats>({
    queryFn: async () => {
      const res = await fetch("/api/github/stats");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<GitHubStats>;
    },
    queryKey: ["github-stats"],
    staleTime: 1000 * 60 * 60,
  });

export const GitHubStats = () => {
  const { data, isPending } = useGitHubStats();

  const stats = [
    { label: "commits this month", value: data?.commitsThisMonth ?? 0 },
    { label: "total commits", value: data?.totalCommits ?? 0 },
    { label: "pull requests this month", value: data?.prsThisMonth ?? 0 },
  ];

  return (
    <div className="mt-4 sm:mt-6">
      <div className="flex space-x-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <span className="text-xs font-medium tabular-nums sm:text-sm">
              {isPending ? "..." : stat.value.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider sm:text-xs">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {data?.orgs && data.orgs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider sm:text-xs">
            orgs
          </span>
          {data.orgs.map((org) => (
            <a
              key={org.login}
              href={org.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5"
            >
              <span className="text-[10px] font-medium sm:text-xs">{org.login}</span>
              <img
                src={org.avatar_url}
                alt={org.login}
                className="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
