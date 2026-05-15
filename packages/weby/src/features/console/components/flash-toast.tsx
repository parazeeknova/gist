import { useEffect, useState } from "react";

const FLASH_TOAST_KEY = "verso-console-flash-toast";
const FLASH_TOAST_EVENT = "verso-console-flash-toast";

interface FlashToastProps {
  isDarkMode: boolean;
}

export const FLASH_TOAST_STORAGE_KEY = FLASH_TOAST_KEY;

export const setFlashToast = (message: string) => {
  try {
    sessionStorage.setItem(FLASH_TOAST_KEY, message);
    window.dispatchEvent(new Event(FLASH_TOAST_EVENT));
  } catch {
    // ignore storage failures
  }
};

export const FlashToast = ({ isDarkMode }: FlashToastProps) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const showToast = () => {
      try {
        const stored = sessionStorage.getItem(FLASH_TOAST_KEY);
        if (!stored) {
          return;
        }
        sessionStorage.removeItem(FLASH_TOAST_KEY);
        setMessage(stored);
      } catch {
        // ignore storage failures
      }
    };

    window.addEventListener(FLASH_TOAST_EVENT, showToast);
    showToast();

    return () => window.removeEventListener(FLASH_TOAST_EVENT, showToast);
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timeout = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) {
    return null;
  }

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-10000 -translate-x-1/2">
      <div
        className={`px-3 py-1.5 text-[11px] lowercase shadow-lg ${t("bg-neutral-800 text-white", "bg-neutral-100 text-black border border-black/10")}`}
      >
        {message}
      </div>
    </div>
  );
};
