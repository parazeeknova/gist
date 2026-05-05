import type {
  ConsolePage,
  ConsolePageDetail,
  ConsoleUser,
  CreatePageInput,
  Group,
  GroupMember,
  MovePageInput,
  PageHistoryItem,
  PageTreeItem,
  RestorePageInput,
  Space,
  SpaceMemberMixed,
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
    mutationFn: (input: {
      name: string;
      slug: string;
      icon?: string;
      description?: string;
      workspaceId: string;
    }) =>
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

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; slug: string; icon?: string; description?: string };
    }) =>
      fetchProtected<Space>(`/api/console/spaces/${id}`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["space", variables.id] });
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

export const useSpaceMembers = (spaceId: string) =>
  useQuery<SpaceMemberMixed[]>({
    enabled: spaceId !== "",
    queryFn: ({ signal }) =>
      fetchProtected<SpaceMemberMixed[]>(`/api/console/spaces/${spaceId}/members`, { signal }),
    queryKey: ["spaceMembers", spaceId],
    staleTime: 30 * 1000,
  });

export const useUpdateSpaceMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, userId, role }: { spaceId: string; userId: string; role: string }) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${spaceId}/members/${userId}`, {
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["spaceMembers", variables.spaceId] });
    },
  });
};

export const useRemoveSpaceMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: string; userId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${spaceId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["spaceMembers", variables.spaceId] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
};

export const useAddSpaceGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, role, spaceId }: { groupId: string; role: string; spaceId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${spaceId}/groups/${groupId}`, {
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["spaceMembers", variables.spaceId] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
};

export const useUpdateSpaceGroupRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, role, spaceId }: { groupId: string; role: string; spaceId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${spaceId}/groups/${groupId}`, {
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["spaceMembers", variables.spaceId] });
    },
  });
};

export const useRemoveSpaceGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, spaceId }: { groupId: string; spaceId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${spaceId}/groups/${groupId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["spaceMembers", variables.spaceId] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
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

// Users
export const useUsers = () =>
  useQuery<ConsoleUser[]>({
    queryFn: ({ signal }) => fetchProtected<ConsoleUser[]>("/api/console/users", { signal }),
    queryKey: ["users"],
    staleTime: 30 * 1000,
  });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      fetchProtected<{ status: string }>(`/api/console/users/${id}/role`, {
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUserActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchProtected<{ status: string }>(`/api/console/users/${id}/active`, {
        body: JSON.stringify({ is_active: isActive }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ status: string }>(`/api/console/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Debug
export interface DebugTableInfo {
  name: string;
  enabled: boolean;
}

export interface DebugTableData {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
}

// Groups
export const useGroupMembers = (groupId: string) =>
  useQuery<{ members: GroupMember[] }>({
    enabled: groupId !== "",
    queryFn: ({ signal }) =>
      fetchProtected<{ members: GroupMember[] }>(`/api/console/groups/${groupId}/members`, {
        signal,
      }),
    queryKey: ["groupMembers", groupId],
    staleTime: 30 * 1000,
  });

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/groups/${groupId}/members`, {
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      input,
    }: {
      workspaceId: string;
      input: { name: string; description?: string };
    }) =>
      fetchProtected<Group>(`/api/console/workspaces/${workspaceId}/groups`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; description?: string } }) =>
      fetchProtected<Group>(`/api/console/groups/${id}`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ status: string }>(`/api/console/groups/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useDebugTables = () =>
  useQuery<DebugTableInfo[]>({
    queryFn: async ({ signal }) => {
      const raw = await fetchProtected<unknown>("/api/console/debug/tables", { signal });
      // Normalize legacy string[] responses to DebugTableInfo[]
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
