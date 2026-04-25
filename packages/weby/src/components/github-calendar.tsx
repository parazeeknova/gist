import { useState, useEffect } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { Tooltip } from "react-tooltip";

interface GitHubActivityProps {
  username: string;
  isDarkMode?: boolean;
}

export const GitHubActivity = ({ username, isDarkMode = true }: GitHubActivityProps) => {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="mt-6 sm:mt-8">
      <h3 className="mb-3 text-base font-medium">activity overview</h3>
      <GitHubCalendar
        username={username}
        colorScheme={isDarkMode ? "dark" : "light"}
        blockSize={isNarrow ? 5 : 10}
        blockMargin={isNarrow ? 1 : 3}
        blockRadius={2}
        fontSize={isNarrow ? 10 : 12}
        showColorLegend
        showTotalCount
        style={{ color: "inherit" }}
      />
      <Tooltip id="github-calendar-tooltip" />
    </div>
  );
};
