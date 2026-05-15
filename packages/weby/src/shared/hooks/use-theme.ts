import { useCallback, useEffect } from "react";
import { useThemeStore } from "#/shared/hooks/theme-store";
import type { ThemePreference } from "#/shared/hooks/theme-store";

export type { ThemePreference } from "#/shared/hooks/theme-store";

export const useTheme = () => {
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
  const setPreference = useThemeStore((s) => s.setPreference);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isDarkMode = resolved === "dark";

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      setPreference(preference);
    },
    [setPreference],
  );

  const toggleTheme = useCallback(() => {
    toggle();
  }, [toggle]);

  return { isDarkMode, setThemePreference, toggleTheme };
};
