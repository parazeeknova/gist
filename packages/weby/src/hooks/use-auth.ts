import type { AuthUser } from "#/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProtected } from "./fetch-protected";

export const useAuth = () => {
  const queryClient = useQueryClient();

  return useQuery<AuthUser | null>({
    queryFn: async ({ signal }) => {
      try {
        return await fetchProtected<AuthUser>("/api/auth/me", { signal });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }
        // Only clear the cached auth state on explicit unauthenticated responses.
        // Network errors, 5xx, etc. should not flush the cache.
        if (
          error instanceof Error &&
          (error.message.startsWith("HTTP 401") || error.message.startsWith("HTTP 403"))
        ) {
          queryClient.setQueryData(["auth"], null);
          return null;
        }
        throw error;
      }
    },
    queryKey: ["auth"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAuthActions = () => {
  const queryClient = useQueryClient();

  const login = async (usernameOrEmail: string, password: string, email?: string) => {
    const body: Record<string, string> = { password, usernameOrEmail };
    if (email) {
      body.email = email;
    }
    const res = await fetch("/api/auth/login", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error((err as { error?: string }).error ?? "Login failed");
    }
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
    return res.json() as Promise<unknown>;
  };

  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) {
      throw new Error("Logout failed");
    }
    queryClient.setQueryData(["auth"], null);
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  return { login, logout };
};
