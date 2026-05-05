import { useCallback, useEffect, useState } from "react";
import { fetchProtected } from "./fetch-protected";

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    const code = rawData.codePointAt(i);
    if (code !== undefined) {
      outputArray[i] = code;
    }
  }
  return outputArray;
};

export const usePushSubscription = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration> => {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError("Push notifications not supported in this browser.");
        setIsLoading(false);
        return;
      }

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        setError("Notification permission denied.");
        setIsLoading(false);
        return;
      }

      const registration = await registerServiceWorker();

      const keyData = await fetchProtected<{ publicKey: string }>("/api/console/push/public-key");
      const { publicKey } = keyData;
      if (!publicKey) {
        setError("VAPID public key not configured on server.");
        setIsLoading(false);
        return;
      }

      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const pushSub = await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        userVisibleOnly: true,
      });

      const rawKey = pushSub.getKey("p256dh");
      const rawAuth = pushSub.getKey("auth");

      if (!rawKey || !rawAuth) {
        setError("Failed to get push subscription keys.");
        setIsLoading(false);
        return;
      }

      const p256dh = btoa(String.fromCodePoint(...new Uint8Array(rawKey)))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
      const auth = btoa(String.fromCodePoint(...new Uint8Array(rawAuth)))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");

      await fetchProtected<{ status: string }>("/api/console/push/subscribe", {
        body: JSON.stringify({
          auth,
          endpoint: pushSub.endpoint,
          p256dh,
          userAgent: navigator.userAgent,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      setIsSubscribed(true);
      // oxlint-disable-next-line unicorn/catch-error-name
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe to push notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await fetchProtected<{ status: string }>("/api/console/push/unsubscribe", {
          body: JSON.stringify({ endpoint: existingSub.endpoint }),
          headers: { "Content-Type": "application/json" },
          method: "DELETE",
        });
        await existingSub.unsubscribe();
      }
      setIsSubscribed(false);
      // oxlint-disable-next-line unicorn/catch-error-name
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to unsubscribe from push notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshState = useCallback(async () => {
    checkPermission();
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!existingSub);
      } catch {
        setIsSubscribed(false);
      }
    }
  }, [checkPermission]);

  useEffect(() => {
    checkPermission();
    refreshState();
  }, [checkPermission, refreshState]);

  return {
    error,
    isLoading,
    isSubscribed,
    permission,
    refreshState,
    subscribe,
    unsubscribe,
  };
};
