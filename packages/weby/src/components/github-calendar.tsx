import { useCallback, useSyncExternalStore } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { Tooltip } from "react-tooltip";

interface GitHubActivityProps {
  username: string;
  isDarkMode?: boolean;
}

const useIsNarrow = (): boolean => {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < 640;
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  // eslint-disable-next-line promise/prefer-await-to-callbacks -- useSyncExternalStore requires callback pattern
  const subscribe = useCallback((callback: () => void) => {
    // eslint-disable-next-line promise/prefer-await-to-callbacks -- event handler callback required
    const handleResize = () => callback();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export const GitHubActivity = ({ username, isDarkMode = true }: GitHubActivityProps) => {
  const isNarrow = useIsNarrow();

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
