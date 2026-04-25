import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface ScrollContainerProps {
  children: ReactNode;
  className?: string;
  isDarkMode?: boolean;
}

export const ScrollContainer = ({
  children,
  className = "",
  isDarkMode = true,
}: ScrollContainerProps) => {
  const panelBg = isDarkMode ? "#000000" : "#ffffff";
  const ref = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const updateShadows = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowTopShadow(scrollTop > 4);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 4);
    };

    updateShadows();
    el.addEventListener("scroll", updateShadows, { passive: true });

    const observer = new ResizeObserver(updateShadows);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateShadows);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} className="h-full overflow-y-auto projects-scroll">
        {children}
      </div>

      {showTopShadow && (
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-16"
          style={{
            background: `linear-gradient(to bottom, ${panelBg} 0%, transparent 100%)`,
          }}
        />
      )}

      {showBottomShadow && (
        <>
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: `linear-gradient(to top, ${panelBg} 0%, transparent 100%)`,
            }}
          />
          <div className="pointer-events-none absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <span>more</span>
          </div>
        </>
      )}
    </div>
  );
};
