import { DatabaseIcon, GearSixIcon, QuestionIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/shared/hooks/use-theme";

interface SidebarFooterProps {
  isDebugRoute: boolean;
  isSettingsRoute: boolean;
}

export const SidebarFooter = ({ isDebugRoute, isSettingsRoute }: SidebarFooterProps) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div
      className={`mt-2 space-y-2 border-t pt-2 ${t("border-border-dark", "border-border-light")}`}
    >
      <button
        className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${isSettingsRoute ? t("text-text-dark", "text-text-light") : t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
        onClick={() => navigate({ to: "/settings/account/profile" })}
        type="button"
      >
        <GearSixIcon size={12} />
        <span className={isSettingsRoute ? "border-b" : ""}>settings</span>
      </button>
      <button
        className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
        type="button"
      >
        <QuestionIcon size={12} />
        help & feedback
      </button>
      <button
        className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${isDebugRoute ? t("text-text-dark", "text-text-light") : t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
        onClick={() => navigate({ search: { table: undefined }, to: "/home/debug" })}
        type="button"
      >
        <DatabaseIcon size={12} />
        <span className={isDebugRoute ? "border-b" : ""}>debug & database</span>
      </button>
      <p className={`px-1 text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
        powered by{" "}
        <a
          className="underline"
          href="https://github.com/parazeeknova/verso"
          rel="noopener noreferrer"
          target="_blank"
        >
          verso
        </a>{" "}
        know more at{" "}
        <a className="underline" href="/about" target="_blank" rel="noopener noreferrer">
          here
        </a>
      </p>
    </div>
  );
};
