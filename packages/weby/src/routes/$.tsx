import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../hooks/use-theme";

const NotFound = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [count, setCount] = useState(5);
  const [exiting, setExiting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? "#111111" : "#eeeeee";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (!exiting && ref.current) {
      setExiting(true);
      gsap.to(ref.current, {
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          void navigate({ replace: true, to: "/" });
        },
        opacity: 0,
        scale: 0.97,
      });
    }
  }, [count, navigate, exiting]);

  return (
    <div
      ref={ref}
      className={`flex min-h-screen flex-col items-center justify-center ${t("bg-bg-dark", "bg-bg-light")}`}
    >
      <p className={`text-lg lowercase ${t("text-text-dark/60", "text-text-light/60")}`}>
        lost something ?
      </p>
      <p className={`mt-3 text-[13px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
        redirecting to home in {count}s
      </p>
    </div>
  );
};

export const Route = createFileRoute("/$")({
  component: NotFound,
});
