import { useQuery } from "@tanstack/react-query";

interface GitHubStats {
  commitsThisMonth: number;
  totalCommits: number;
  prsThisMonth: number;
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
    <div className="mt-4 flex space-x-6 sm:mt-6">
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
  );
};
