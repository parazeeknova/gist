import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/hooks/use-theme";
import type React from "react";

interface FloatingSidebarProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const FloatingSidebar = ({ children, footer }: FloatingSidebarProps) => {
  const { isDarkMode } = useTheme();
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [hovering, setHovering] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const show = useCallback(() => {
    setHovering(true);
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
    }
    if (enterTimer.current) {
      return;
    }
    enterTimer.current = setTimeout(() => {
      enterTimer.current = null;
      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, { duration: 0.2, opacity: 0 });
      }
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
    }, 180);
  }, []);

  const hide = useCallback(() => {
    setHovering(false);
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    setVisible(false);
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      setRendered(false);
      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, { delay: 0.1, duration: 0.25, opacity: 1 });
      }
    }, 250);
  }, []);

  useEffect(() => {
    if (!popoverRef.current) {
      return;
    }
    if (visible) {
      gsap.killTweensOf(popoverRef.current);
      gsap.fromTo(
        popoverRef.current,
        { opacity: 0, scale: 0.97, x: -24 },
        { duration: 0.35, ease: "power3.out", opacity: 1, scale: 1, x: 0 },
      );
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (enterTimer.current) {
        clearTimeout(enterTimer.current);
      }
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current);
      }
    },
    [],
  );

  return (
    <>
      <div
        ref={indicatorRef}
        className={`fixed left-0 z-40 h-[85vh] max-h-175 w-1.5 ${hovering ? "bg-white/10 shadow-[4px_0_16px_rgba(255,255,255,0.06)] w-2" : "bg-transparent hover:bg-white/3"}`}
        onMouseEnter={show}
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      {rendered && (
        <div
          ref={popoverRef}
          className={`fixed left-0 z-50 flex h-[85vh] max-h-200 w-72 flex-col border-r overflow-hidden py-4 shadow-2xl transition-colors duration-500 ease-out ${t("border-border-dark", "border-border-light")} ${isDarkMode ? "bg-[#171717]" : "bg-[#e8e8e8]"}`}
          onMouseLeave={hide}
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          <div className="min-h-0 flex-1 flex flex-col">{children}</div>
          <div className="px-4">{footer}</div>
        </div>
      )}
    </>
  );
};
