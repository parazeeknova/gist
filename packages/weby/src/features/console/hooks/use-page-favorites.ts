import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProtected } from "#/features/auth/hooks/fetch-protected";

export const useTogglePageFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) =>
      fetchProtected<{ favorited: boolean }>(`/api/console/pages/${pageId}/favorite`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageFavorites"] });
      queryClient.invalidateQueries({ queryKey: ["pageFavorited"] });
    },
  });
};

export const useIsPageFavorited = (pageId: string) =>
  useQuery<{ favorited: boolean }>({
    enabled: pageId !== "",
    queryFn: ({ signal }) =>
      fetchProtected<{ favorited: boolean }>(`/api/console/pages/${pageId}/favorited`, { signal }),
    queryKey: ["pageFavorited", pageId],
    refetchOnMount: true,
    staleTime: 30 * 1000,
  });

export const useFavoritedPages = () =>
  useQuery<string[]>({
    queryFn: ({ signal }) => fetchProtected<string[]>("/api/console/pages/favorites", { signal }),
    queryKey: ["pageFavorites"],
    refetchOnMount: true,
    staleTime: 30 * 1000,
  });
