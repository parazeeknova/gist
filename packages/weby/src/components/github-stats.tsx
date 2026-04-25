import { useQuery } from "@tanstack/react-query";

interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    size?: number;
  };
}

interface GitHubStats {
  commitsThisMonth: number;
  totalCommits: number;
  prsThisMonth: number;
}

const fetchGitHubEvents = async (username: string): Promise<GitHubEvent[]> => {
  const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }
  return res.json() as Promise<GitHubEvent[]>;
};

const fetchGitHubPRs = async (username: string): Promise<number> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const [dateStr] = firstDay.toISOString().split("T");

  const res = await fetch(
    `https://api.github.com/search/issues?q=author:${username}+type:pr+created:>${dateStr}&per_page=1`,
    {
      headers: { Accept: "application/vnd.github.v3+json" },
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub Search API ${res.status}`);
  }
  const data = (await res.json()) as { total_count: number };
  return data.total_count;
};

const useGitHubStats = (username: string) =>
  useQuery<GitHubStats>({
    queryFn: async () => {
      const [events, prsThisMonth] = await Promise.all([
        fetchGitHubEvents(username),
        fetchGitHubPRs(username),
      ]);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

      let commitsThisMonth = 0;
      let totalCommits = 0;

      for (const event of events) {
        if (event.type === "PushEvent") {
          const count = event.payload.size ?? 0;
          totalCommits += count;

          const eventDate = new Date(event.created_at);
          if (eventDate >= firstDay) {
            commitsThisMonth += count;
          }
        }
      }

      return { commitsThisMonth, prsThisMonth, totalCommits };
    },
    queryKey: ["github-stats", username],
    staleTime: 1000 * 60 * 60,
  });

interface GitHubStatsProps {
  username: string;
}

export const GitHubStats = ({ username }: GitHubStatsProps) => {
  const { data, isPending } = useGitHubStats(username);

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
