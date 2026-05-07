import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  BugBeetleIcon,
  ClockCounterClockwiseIcon,
  CodeIcon,
  GlobeIcon,
  KeyIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
  SquaresFourIcon,
  UserIcon,
  UsersIcon,
  UsersThreeIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { SidebarTooltip } from "./sidebar-tooltip";

interface SettingsSidebarProps {
  currentWorkspaceName?: string;
  isGroupsRoute: boolean;
  isMembersRoute: boolean;
  isPreferencesRoute: boolean;
  isProfileRoute: boolean;
  isSpacesRoute: boolean;
  isWorkspaceRoute: boolean;
  onBack: () => void;
  userIsOwner?: boolean;
}

export const SettingsSidebar = ({
  currentWorkspaceName,
  isGroupsRoute,
  isMembersRoute,
  isPreferencesRoute,
  isProfileRoute,
  isSpacesRoute,
  isWorkspaceRoute,
  onBack,
  userIsOwner,
}: SettingsSidebarProps) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const navItemClass = (isActive: boolean) =>
    isActive
      ? t("bg-white/5 text-text-dark/90", "bg-black/3 text-text-light/90")
      : t(
          "text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80",
          "text-text-light/50 hover:bg-black/3 hover:text-text-light/80",
        );

  return (
    <div className="min-h-0 w-70 flex-1 flex flex-col overflow-y-auto px-4">
      <div
        className={`flex items-center justify-between px-1 py-2 border-b ${t("border-border-dark", "border-border-light")}`}
      >
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 text-[11px] lowercase ${t("text-text-dark/70 hover:text-text-dark/90", "text-text-light/70 hover:text-text-light/90")}`}
          type="button"
        >
          <ArrowLeftIcon size={12} />
          back
        </button>
        <span className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}>
          settings
        </span>
      </div>

      <div className="mt-2">
        <p
          className={`px-1 mb-1 text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          account
        </p>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(isProfileRoute)}`}
          onClick={() => navigate({ to: "/settings/account/profile" })}
          type="button"
        >
          <UserIcon size={12} />
          profile
        </button>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(isPreferencesRoute)}`}
          onClick={() => navigate({ to: "/settings/account/preferences" })}
          type="button"
        >
          <SlidersHorizontalIcon size={12} />
          preferences
        </button>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <KeyIcon size={12} />
            api key
          </button>
        </SidebarTooltip>
      </div>

      <div className="mt-4">
        <p
          className={`px-1 mb-1 text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          workspaces
        </p>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(isWorkspaceRoute)}`}
          onClick={() => navigate({ search: { name: undefined }, to: "/settings/workspace" })}
          type="button"
        >
          <WrenchIcon size={12} />
          general
        </button>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(isMembersRoute)}`}
          onClick={() => navigate({ to: "/settings/members" })}
          type="button"
        >
          <UsersIcon size={12} />
          members
        </button>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <ShieldCheckIcon size={12} />
            security & sso
          </button>
        </SidebarTooltip>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(isGroupsRoute)}`}
          onClick={() => navigate({ to: "/settings/groups" })}
          type="button"
        >
          <UsersThreeIcon size={12} />
          groups
        </button>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(isSpacesRoute)}`}
          onClick={() =>
            navigate({
              search: { workspace: currentWorkspaceName },
              to: "/settings/spaces",
            })
          }
          type="button"
        >
          <SquaresFourIcon size={12} />
          spaces
        </button>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <GlobeIcon size={12} />
            public sharing
          </button>
        </SidebarTooltip>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <SealCheckIcon size={12} />
            verified pages
          </button>
        </SidebarTooltip>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <CodeIcon size={12} />
            api management
          </button>
        </SidebarTooltip>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <SparkleIcon size={12} />
            ai settings
          </button>
        </SidebarTooltip>
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <ClockCounterClockwiseIcon size={12} />
            audit log
          </button>
        </SidebarTooltip>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between px-1 mb-1">
          <p
            className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            systems
          </p>
          <span className={`text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
            v{import.meta.env.VITE_APP_VERSION}
          </span>
        </div>
        {userIsOwner && (
          <button
            className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${navItemClass(false)}`}
            onClick={() => navigate({ search: { table: undefined }, to: "/home/debug" })}
            type="button"
          >
            <BugBeetleIcon size={12} />
            debug
          </button>
        )}
        <SidebarTooltip label="coming soon">
          <button
            className={`flex w-full cursor-not-allowed items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase opacity-40 ${t("text-text-dark/50", "text-text-light/50")}`}
            type="button"
          >
            <ArrowClockwiseIcon size={12} />
            update
          </button>
        </SidebarTooltip>
      </div>
    </div>
  );
};
