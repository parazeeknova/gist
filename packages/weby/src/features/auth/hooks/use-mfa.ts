import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProtected } from "./fetch-protected";

export interface MFAStatus {
  is_enabled: boolean;
  method: string;
  workspace_enforced: boolean;
}

export interface MFASetupResult {
  secret: string;
  qr_uri: string;
  manual_key: string;
}

export interface MFABackupCodesResult {
  codes: string[];
}

export const useMFAStatus = () =>
  useQuery<MFAStatus>({
    queryFn: ({ signal }) => fetchProtected<MFAStatus>("/api/console/mfa/status", { signal }),
    queryKey: ["mfa", "status"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

export const useMFASetup = () =>
  useMutation<MFASetupResult, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/console/mfa/setup", {
        body: JSON.stringify({}),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "setup failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "setup failed");
      }
      return res.json() as Promise<MFASetupResult>;
    },
  });

export const useMFAEnable = () => {
  const queryClient = useQueryClient();
  return useMutation<MFABackupCodesResult, Error, { code: string }>({
    mutationFn: async ({ code }) => {
      const res = await fetch("/api/console/mfa/enable", {
        body: JSON.stringify({ code }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "enable failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "enable failed");
      }
      return res.json() as Promise<MFABackupCodesResult>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
    },
  });
};

export const useMFADisable = () => {
  const queryClient = useQueryClient();
  return useMutation<null, Error, { password: string }>({
    mutationFn: async ({ password }) => {
      const res = await fetch("/api/console/mfa/disable", {
        body: JSON.stringify({ password }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "disable failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "disable failed");
      }
      return null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
    },
  });
};

export const useMFABackupCodes = () =>
  useMutation<MFABackupCodesResult, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/console/mfa/backup-codes", {
        body: JSON.stringify({}),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "backup codes failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "backup codes failed");
      }
      return res.json() as Promise<MFABackupCodesResult>;
    },
  });

export const useMFAVerify = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { code: string }>({
    mutationFn: async ({ code }) => {
      const res = await fetch("/api/auth/mfa/verify", {
        body: JSON.stringify({ code }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "verification failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "verification failed");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["auth"] });
    },
  });
};
