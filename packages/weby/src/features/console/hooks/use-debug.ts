import { useQuery } from "@tanstack/react-query";
import { fetchProtected } from "#/features/auth/hooks/fetch-protected";

export interface DebugTableInfo {
  name: string;
  enabled: boolean;
}

export interface DebugTableData {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
}

export interface DebugStorageOrphanBucketReport {
  bucket: string;
  orphanObjectCount: number;
  orphanSample: string[];
  referencedCount: number;
  totalObjectCount: number;
}

export interface DebugStorageOrphanReport {
  buckets: DebugStorageOrphanBucketReport[];
  generatedAtUtc: string;
  totalBuckets: number;
  totalObjectCount: number;
  totalOrphanCount: number;
  totalReferenceSet: number;
}

export interface DebugStorageObjectItem {
  bucket: string;
  key: string;
}

export interface DebugStorageBucketObjects {
  bucket: string;
  objectCount: number;
  objects: DebugStorageObjectItem[];
}

export interface DebugStorageObjectsResponse {
  buckets: DebugStorageBucketObjects[];
  generatedAtUtc: string;
  totalBucketCount: number;
  totalObjectCount: number;
}

const isDebugTableInfo = (value: unknown): value is DebugTableInfo =>
  !!value &&
  typeof value === "object" &&
  "name" in value &&
  typeof value.name === "string" &&
  "enabled" in value &&
  typeof value.enabled === "boolean";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isDebugTableInfoArray = (value: unknown): value is DebugTableInfo[] =>
  Array.isArray(value) && value.every((entry) => isDebugTableInfo(entry));

export const useDebugTables = () =>
  useQuery<DebugTableInfo[]>({
    queryFn: async ({ signal }) => {
      const raw = await fetchProtected<unknown>("/api/console/debug/tables", { signal });
      if (isStringArray(raw)) {
        return raw.map((name) => ({ enabled: true, name }));
      }
      if (isDebugTableInfoArray(raw)) {
        return raw;
      }
      return [];
    },
    queryKey: ["debugTables"],
    staleTime: 30 * 1000,
  });

export const useDebugStorageOrphanReport = () =>
  useQuery<DebugStorageOrphanReport>({
    enabled: false,
    queryFn: ({ signal }) =>
      fetchProtected<DebugStorageOrphanReport>("/api/console/debug/tables?scope=storage-orphans", {
        signal,
      }),
    queryKey: ["debugStorageOrphans"],
  });

export const useDebugStorageObjects = () =>
  useQuery<DebugStorageObjectsResponse>({
    queryFn: ({ signal }) =>
      fetchProtected<DebugStorageObjectsResponse>(
        "/api/console/debug/tables?scope=storage-objects",
        {
          signal,
        },
      ),
    queryKey: ["debugStorageObjects"],
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
