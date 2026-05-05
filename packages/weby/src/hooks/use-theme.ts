import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

let listeners: (() => void)[] = [];

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getResolvedTheme = (): "light" | "dark" => {
  if (typeof document === "undefined") {
    return "dark";
  }
  const dataset = document.documentElement.dataset.theme;
  if (dataset === "light" || dataset === "dark") {
    return dataset;
  }
  return "dark";
};

const getThemeSnapshot = (): boolean => getResolvedTheme() === "dark";

// eslint-disable-next-line promise/prefer-await-to-callbacks -- useSyncExternalStore requires callback-based subscribe
const subscribe = (callback: () => void) => {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
};

const notify = () => {
  for (const cb of listeners) {
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    cb();
  }
};

let initialized = false;

const ensureInitialized = () => {
  if (initialized) {
    return;
  }
  initialized = true;
  if (typeof document !== "undefined" && !document.documentElement.dataset.theme) {
    let preference: ThemePreference = "dark";
    try {
      const stored = localStorage.getItem("theme-preference");
      if (stored === "light" || stored === "dark" || stored === "system") {
        preference = stored;
      } else {
        const legacy = localStorage.getItem("theme");
        if (legacy === "light" || legacy === "dark") {
          preference = legacy;
        }
      }
    } catch {
      // Storage unavailable
    }
    const resolved = preference === "system" ? getSystemTheme() : preference;
    document.documentElement.dataset.theme = resolved;
    notify();
  }
};

const applyThemePreference = (preference: ThemePreference) => {
  const resolved = preference === "system" ? getSystemTheme() : preference;
  document.documentElement.dataset.theme = resolved;
  try {
    localStorage.setItem("theme-preference", preference);
  } catch {
    // Storage unavailable
  }
  notify();
};

export const getThemePreference = (): ThemePreference => {
  if (typeof localStorage === "undefined") {
    return "dark";
  }
  const stored = localStorage.getItem("theme-preference");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  const legacy = localStorage.getItem("theme");
  if (legacy === "light" || legacy === "dark") {
    return legacy;
  }
  return "dark";
};

export const useTheme = () => {
  const isDarkMode = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeSnapshot);

  useEffect(() => {
    ensureInitialized();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDarkMode ? "light" : "dark";
    applyThemePreference(next);
  }, [isDarkMode]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    applyThemePreference(preference);
  }, []);

  return { isDarkMode, setThemePreference, toggleTheme };
};
