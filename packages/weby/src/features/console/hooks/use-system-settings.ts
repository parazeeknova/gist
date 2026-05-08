import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProtected } from "#/features/auth/hooks/fetch-protected";

export interface SystemSetting {
  key: string;
  updatedAt: string;
  updatedBy?: string;
  value: boolean;
}

export const useSystemSettings = () =>
  useQuery<SystemSetting[]>({
    enabled: typeof window !== "undefined",
    queryFn: async ({ signal }) => {
      const raw = await fetchProtected<{ settings: SystemSetting[] }>(
        "/api/console/system-settings",
        { signal },
      );
      return raw.settings ?? [];
    },
    queryKey: ["systemSettings"],
    staleTime: 0,
  });

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      await fetchProtected("/api/console/system-settings", {
        body: JSON.stringify({ key, value }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      void queryClient.invalidateQueries({ queryKey: ["debugTables"] });
    },
  });
};

export const useDebugRoutesEnabled = () => {
  const { data: settings } = useSystemSettings();
  return settings?.find((s) => s.key === "debug_routes")?.value ?? false;
};

export const useDebugApiEnabled = () => {
  const { data: settings } = useSystemSettings();
  return settings?.find((s) => s.key === "debug_api")?.value ?? false;
};
