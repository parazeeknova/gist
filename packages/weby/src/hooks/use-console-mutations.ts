import type {
  ConsolePage,
  ConsolePageDetail,
  CreatePageInput,
  MovePageInput,
  PageHistoryItem,
  PageTreeItem,
  RestorePageInput,
  Space,
  UpdatePageInput,
  Workspace,
} from "#/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProtected } from "./fetch-protected";

// Page tree
export const usePageTree = (spaceId: string) =>
  useQuery<PageTreeItem[]>({
    queryFn: ({ signal }) =>
      fetchProtected<PageTreeItem[]>(
        `/api/console/pages/tree?spaceId=${encodeURIComponent(spaceId)}`,
        { signal },
      ),
    queryKey: ["pageTree", spaceId],
    staleTime: 30 * 1000,
  });

// Page children
export const usePageChildren = (parentId: string | null) =>
  useQuery<PageTreeItem[]>({
    enabled: parentId !== null,
    queryFn: ({ signal }) =>
      fetchProtected<PageTreeItem[]>(`/api/console/pages/${parentId}/children`, {
        signal,
      }),
    queryKey: ["pageChildren", parentId],
    staleTime: 30 * 1000,
  });

// Single console page
export const useConsolePage = (pageId: string) =>
  useQuery<ConsolePageDetail>({
    queryFn: ({ signal }) =>
      fetchProtected<ConsolePageDetail>(`/api/console/pages/${pageId}`, { signal }),
    queryKey: ["consolePage", pageId],
    staleTime: 30 * 1000,
  });

// Console pages list
export const useConsolePages = () =>
  useQuery<ConsolePage[]>({
    queryFn: ({ signal }) => fetchProtected<ConsolePage[]>("/api/console/pages", { signal }),
    queryKey: ["consolePages"],
    staleTime: 30 * 1000,
  });

// Create page
export const useCreatePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePageInput) =>
      fetchProtected<ConsolePageDetail>("/api/console/pages", {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consolePages"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Update page
export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePageInput }) =>
      fetchProtected<ConsolePageDetail>(`/api/console/pages/${id}`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["consolePage", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["consolePages"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Delete page
export const useDeletePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ status: string }>(`/api/console/pages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consolePages"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
      queryClient.removeQueries({ queryKey: ["consolePage"] });
    },
  });
};

// Publish page
export const usePublishPage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ id: string; isPublished: boolean; updatedAt: string }>(
        `/api/console/pages/${id}/publish`,
        { method: "POST" },
      ),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["consolePage", id] });
      queryClient.invalidateQueries({ queryKey: ["consolePages"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Unpublish page
export const useUnpublishPage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ id: string; isPublished: boolean; updatedAt: string }>(
        `/api/console/pages/${id}/unpublish`,
        { method: "POST" },
      ),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["consolePage", id] });
      queryClient.invalidateQueries({ queryKey: ["consolePages"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Move page
export const useMovePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovePageInput }) =>
      fetchProtected<{
        id: string;
        position: string;
        parentPageId: string | null;
        updatedAt: string;
      }>(`/api/console/pages/${id}/move`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
      queryClient.invalidateQueries({ queryKey: ["pageChildren"] });
    },
  });
};

// Page history
export const usePageHistory = (pageId: string) =>
  useQuery<PageHistoryItem[]>({
    queryFn: ({ signal }) =>
      fetchProtected<PageHistoryItem[]>(`/api/console/pages/${pageId}/history`, { signal }),
    queryKey: ["pageHistory", pageId],
    staleTime: 30 * 1000,
  });

// Restore page from history
export const useRestorePage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RestorePageInput }) =>
      fetchProtected<ConsolePageDetail>(`/api/console/pages/${id}/restore`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["consolePage", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pageHistory", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["consolePages"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Spaces
export const useSpaces = (workspaceId: string) =>
  useQuery<Space[]>({
    enabled: workspaceId !== "",
    queryFn: ({ signal }) =>
      fetchProtected<Space[]>(
        `/api/console/spaces?workspaceId=${encodeURIComponent(workspaceId)}`,
        { signal },
      ),
    queryKey: ["spaces", workspaceId],
    staleTime: 60 * 1000,
  });

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string; icon?: string }) =>
      fetchProtected<Space>("/api/console/spaces", {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Workspaces
export const useWorkspaces = () =>
  useQuery<Workspace[]>({
    queryFn: ({ signal }) => fetchProtected<Workspace[]>("/api/console/workspaces", { signal }),
    queryKey: ["workspaces"],
    staleTime: 120 * 1000,
  });

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string; icon?: string }) =>
      fetchProtected<Workspace>("/api/console/workspaces", {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ status: string }>(`/api/console/workspaces/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["pageTree"] });
    },
  });
};

// Debug
export interface DebugTableData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export const useDebugTables = () =>
  useQuery<string[]>({
    queryFn: ({ signal }) => fetchProtected<string[]>("/api/console/debug/tables", { signal }),
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
