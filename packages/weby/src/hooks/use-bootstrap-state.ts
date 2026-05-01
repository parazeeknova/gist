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

export interface IsBootstrappedResult {
  bootstrapped: boolean | undefined;
  loading: boolean;
  error: Error | null;
}

export const useIsBootstrapped = (): IsBootstrappedResult => {
  const { data, isLoading, error } = useBootstrapState();
  return {
    bootstrapped: data?.bootstrapped,
    error: error instanceof Error ? error : null,
    loading: Boolean(isLoading && !data && !error),
  };
};
