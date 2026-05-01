import type { BootstrapState } from "#/types";
import { useQuery } from "@tanstack/react-query";

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const useBootstrapState = () =>
  useQuery<BootstrapState>({
    queryFn: ({ signal }) => fetchJson<BootstrapState>("/api/auth/bootstrap-state", { signal }),
    queryKey: ["bootstrapState"],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    staleTime: 5 * 60 * 1000,
  });

export const useIsBootstrapped = (): boolean | undefined => {
  const { data } = useBootstrapState();
  if (data === undefined) {
    return undefined;
  }
  return data.bootstrapped;
};
