import { useNavigate } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { getAuthCache, setAuthCache } from "#/features/auth/lib/auth-cache";
import { useAuth } from "#/features/auth/hooks/use-auth";
import { useTheme } from "#/shared/hooks/use-theme";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isPending, isError } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const loadingRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => getAuthCache() !== "authenticated");
  const hasRedirected = useRef(false);
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (user) {
      setAuthCache("authenticated");
      if (visible && loadingRef.current) {
        gsap.to(loadingRef.current, {
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setVisible(false),
          opacity: 0,
          scale: 0.97,
        });
      } else {
        setVisible(false);
      }
    } else if (isError || !user) {
      setAuthCache("unauthenticated");
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        void navigate({ replace: true, to: "/" });
      }
    }
  }, [isPending, user, isError, visible, navigate]);

  if (visible) {
    return (
      <div
        ref={loadingRef}
        className={`flex min-h-screen items-center justify-center ${t("bg-bg-dark", "bg-bg-light")}`}
      >
        <p className={`text-sm ${t("text-text-dark/40", "text-text-light/40")}`}>
          {isPending ? "checking authentication..." : "redirecting..."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
