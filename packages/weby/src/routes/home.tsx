import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useTheme } from "../hooks/use-theme";
import { ConsoleLayout } from "../components/console/console-layout";

const Console = function Console() {
  // Sync theme init before anything reads it
  if (typeof document !== "undefined" && !document.documentElement.dataset.theme) {
    const saved = typeof localStorage === "undefined" ? null : localStorage.getItem("theme");
    document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
  }
  // Set body bg to match theme (prevents white flash behind loader)
  if (typeof document !== "undefined") {
    document.body.style.backgroundColor =
      document.documentElement.dataset.theme === "light" ? "#eeeeee" : "#111111";
  }

  const { data: user, isPending } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const loadingRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  // Keep body background in sync with theme
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? "#111111" : "#eeeeee";
  }, [isDarkMode]);

  useEffect(() => {
    if (!isPending && !user) {
      void navigate({ replace: true, to: "/" });
    }
  }, [isPending, user, navigate]);

  useEffect(() => {
    if (!isPending && user && !done && loadingRef.current) {
      gsap.to(loadingRef.current, {
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setDone(true),
        opacity: 0,
        scale: 0.97,
      });
    }
    if (isPending) {
      setDone(false);
    }
  }, [isPending, user, done]);

  if (!done) {
    return (
      <div
        ref={loadingRef}
        className={`flex min-h-screen items-center justify-center ${isDarkMode ? "bg-bg-dark" : "bg-bg-light"}`}
      >
        <p className={`text-sm ${isDarkMode ? "text-text-dark/40" : "text-text-light/40"}`}>
          {isPending ? "checking authentication..." : "redirecting..."}
        </p>
      </div>
    );
  }

  return <ConsoleLayout />;
};

export const Route = createFileRoute("/home")({
  component: Console,
  head: () => ({
    links: [{ href: "/home", rel: "canonical" }],
    meta: [
      { title: "verso — console" },
      { content: "noindex, nofollow", name: "robots" },
      { content: "verso — console", property: "og:title" },
      { content: "website", property: "og:type" },
    ],
  }),
});
