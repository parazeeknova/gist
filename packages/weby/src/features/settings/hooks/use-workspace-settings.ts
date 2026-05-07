import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Workspace } from "../types";
import { fetchProtected } from "./fetch-protected";

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: { name: string; slug: string; icon: string };
    }) => {
      const res = await fetchProtected<Workspace>(`/api/console/workspaces/${id}`, {
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};
