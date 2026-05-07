import { useQuery } from "@tanstack/react-query";
import { fetchProtected } from "@/features/auth/hooks/fetch-protected";

export interface DebugTableInfo {
  name: string;
  enabled: boolean;
}

export interface DebugTableData {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
}

export const useDebugTables = () =>
  useQuery<DebugTableInfo[]>({
    queryFn: async ({ signal }) => {
      const raw = await fetchProtected<unknown>("/api/console/debug/tables", { signal });
      if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
        return (raw as string[]).map((name) => ({ enabled: false, name }));
      }
      return raw as DebugTableInfo[];
    },
    queryKey: ["debugTables"],
    staleTime: 30 * 1000,
  });

export const useDebugTableData = (tableName: string | null) =>
  useQuery<DebugTableData>({
    enabled: tableName !== null,
    queryFn: ({ signal }) =>
      fetchProtected<DebugTableData>(`/api/console/debug/tables/${tableName}`, { signal }),
    queryKey: ["debugTableData", tableName],
    staleTime: 10 * 1000,
  });
