import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationItem } from "@/shared/types";

const audio = typeof Audio === "undefined" ? null : new Audio("/notification.mp3");

export const useNotificationStream = () => {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let stopped = false;

    const connect = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok || stopped) {
        return;
      }

      const es = new EventSource("/api/console/notifications/stream");
      esRef.current = es;

      es.addEventListener("message", (event: MessageEvent) => {
        try {
          const notif = JSON.parse(event.data) as NotificationItem;

          queryClient.setQueryData<NotificationItem[]>(["notifications", "list"], (old) => [
            notif,
            ...(old ?? []),
          ]);

          queryClient.setQueryData<{ count: number }>(["notifications", "unread-count"], (old) => ({
            count: (old?.count ?? 0) + 1,
          }));

          void (async () => {
            try {
              await audio?.play();
            } catch {
              // browser may block autoplay
            }
          })();
        } catch {
          // ignore parse errors
        }
      });

      es.addEventListener("error", async () => {
        es.close();
        if (stopped) {
          return;
        }
        // Try refreshing the token before reconnecting
        await fetch("/api/auth/refresh", { method: "POST" });
        if (!stopped) {
          setTimeout(connect, 2000);
        }
      });
    };

    connect();

    return () => {
      stopped = true;
      esRef.current?.close();
    };
  }, [queryClient]);
};
