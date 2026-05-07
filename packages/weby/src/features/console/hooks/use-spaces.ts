import type { Space, SpaceMemberMixed } from "@/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProtected } from "@/features/auth/hooks/fetch-protected";

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

export const useSpaceBySlug = (slug: string) =>
  useQuery<Space>({
    enabled: slug !== "",
    queryFn: ({ signal }) =>
      fetchProtected<Space>(`/api/console/spaces/by-slug/${encodeURIComponent(slug)}`, { signal }),
    queryKey: ["spaceBySlug", slug],
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

export const useAddSpaceMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, spaceId, userId }: { role: string; spaceId: string; userId: string }) =>
      fetchProtected<{ status: string }>(`/api/console/spaces/${spaceId}/members/${userId}`, {
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
