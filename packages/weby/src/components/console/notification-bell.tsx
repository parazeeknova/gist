import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import type { NotificationItem } from "#/types";
import { fetchProtected } from "#/hooks/fetch-protected";

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return date.toLocaleDateString();
};

interface NotificationBellProps {
  isDarkMode: boolean;
}

export const NotificationBell = ({ isDarkMode }: NotificationBellProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryFn: ({ signal }) =>
      fetchProtected<{ count: number }>("/api/console/notifications/unread-count", { signal }),
    queryKey: ["notifications", "unread-count"],
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    enabled: notiOpen,
    queryFn: ({ signal }) =>
      fetchProtected<NotificationItem[]>("/api/console/notifications", { signal }),
    queryKey: ["notifications", "list"],
  });

  const readMutation = useMutation({
    mutationFn: (id: string) =>
      fetchProtected<{ status: string }>(`/api/console/notifications/${id}/read`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () =>
      fetchProtected<{ status: string }>("/api/console/notifications/read-all", {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    if (!notiOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notiOpen]);

  const unreadCount = countData?.count ?? 0;

  return (
    <div className="relative" ref={notiRef}>
      <button
        className={`relative flex items-center gap-1 lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
        onClick={() => setNotiOpen((o) => !o)}
        type="button"
      >
        <BellIcon size={12} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {notiOpen && (
        <div
          className={`absolute right-0 top-full z-50 mt-1 w-64 border shadow-xl ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
        >
          <div className="max-h-80 overflow-y-auto py-1">
            <div
              className={`flex items-center justify-between border-b px-3 pb-1.5 pt-1 ${t("border-border-dark", "border-border-light")}`}
            >
              <span className={`text-[12px] ${t("text-text-dark/70", "text-text-light/70")}`}>
                notifications
              </span>
              <button
                className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
                disabled={readAllMutation.isPending}
                onClick={() => readAllMutation.mutate()}
                type="button"
              >
                clear all
              </button>
            </div>
            {notifications && notifications.length > 0 ? (
              notifications.map((n: NotificationItem) => (
                <button
                  className={`flex w-full gap-2 px-3 py-2 text-left text-[11px] leading-tight ${n.readAt ? t("text-text-dark/40", "text-text-light/40") : t("text-text-dark/70 hover:bg-white/5", "text-text-light/70 hover:bg-black/3")}`}
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) {
                      readMutation.mutate(n.id);
                    }
                  }}
                  type="button"
                >
                  <span className="mt-0.5 shrink-0">
                    {!n.readAt && <span className="block h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="truncate font-medium">{n.title}</span>
                      <span
                        className={`shrink-0 text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}
                      >
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <div className={`mt-0.5 ${t("text-text-dark/50", "text-text-light/50")}`}>
                      {n.actorName ? (
                        <span>
                          <span className="font-medium">{n.actorName}</span>{" "}
                        </span>
                      ) : null}
                      {n.body}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p
                className={`px-3 py-2 text-[11px] ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                {notifications ? "no notifications yet !" : "loading..."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
