import { useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "#/shared/hooks/use-theme";

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
        <div className="pointer-events-none absolute inset-x-0 bottom-full z-50 mb-1.5 flex justify-start">
          <div
            className={`relative whitespace-nowrap px-2 py-1 text-[10px] ${t("bg-neutral-800 text-white", "bg-neutral-200 text-black")}`}
          >
            {label}
            <div
              className={`absolute left-2 top-full h-1 w-1 rotate-45 ${t("bg-neutral-800", "bg-neutral-200")}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
