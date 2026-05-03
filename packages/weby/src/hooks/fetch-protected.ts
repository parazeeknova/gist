let refreshPromise: Promise<boolean> | null = null;

const refreshTokens = (): Promise<boolean> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const fetchProtected = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let res = await fetch(url, { ...init, credentials: "include" });
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await fetch(url, { ...init, credentials: "include" });
    }
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};
