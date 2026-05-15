import { useEffect } from "react";
import { useThemeStore } from "#/shared/hooks/theme-store";
import type { ThemePreference } from "#/shared/hooks/theme-store";

export type { ThemePreference };

export const useTheme = () => {
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
  const setPreference = useThemeStore((s) => s.setPreference);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isDarkMode = resolved === "dark";

  return { isDarkMode, setThemePreference: setPreference, toggleTheme: toggle };
};
