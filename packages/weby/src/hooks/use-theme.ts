import { useCallback, useEffect, useSyncExternalStore } from "react";

let listeners: (() => void)[] = [];

const getThemeSnapshot = (): boolean => {
  if (typeof document === "undefined") {
    return true;
  }
  return document.documentElement.dataset.theme !== "light";
};

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
    let stored = "dark";
    try {
      stored = localStorage.getItem("theme") || "dark";
    } catch {
      // Storage unavailable (e.g., Safari private mode)
    }
    document.documentElement.dataset.theme = stored;
    notify();
  }
};

export const useTheme = () => {
  const isDarkMode = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeSnapshot);

  useEffect(() => {
    ensureInitialized();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDarkMode ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage unavailable (e.g., Safari private mode)
    }
    notify();
  }, [isDarkMode]);

  return { isDarkMode, toggleTheme };
};
