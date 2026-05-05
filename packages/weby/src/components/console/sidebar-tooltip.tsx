import { useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "../../hooks/use-theme";

interface TooltipProps {
  children: ReactNode;
  label: string;
}

export const SidebarTooltip = ({ children, label }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div
      className="relative flex w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border px-2 py-1 text-[10px] shadow-sm ${t("border-border-dark bg-surface-dark text-text-dark", "border-border-light bg-surface-light text-text-light")}`}
        >
          {label}
          <div
            className={`absolute left-1/2 top-full h-1 w-1 -translate-x-1/2 rotate-45 border-b border-r ${t("border-border-dark bg-surface-dark", "border-border-light bg-surface-light")}`}
          />
        </div>
      )}
    </div>
  );
};
