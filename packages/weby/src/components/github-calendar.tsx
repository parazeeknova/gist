import { GitHubCalendar } from "react-github-calendar";
import { Tooltip } from "react-tooltip";

interface GitHubActivityProps {
  username: string;
  isDarkMode?: boolean;
}

export const GitHubActivity = ({ username, isDarkMode = true }: GitHubActivityProps) => (
  <div className="mt-6 sm:mt-8">
    <h3 className="mb-3 text-base font-medium">activity overview</h3>
    <div className="overflow-x-auto">
      <GitHubCalendar
        username={username}
        colorScheme={isDarkMode ? "dark" : "light"}
        blockSize={10}
        blockMargin={3}
        blockRadius={2}
        fontSize={12}
        showColorLegend
        showTotalCount
        style={{ color: "inherit" }}
      />
    </div>
    <Tooltip id="github-calendar-tooltip" />
  </div>
);
