import { DatabaseIcon, GearSixIcon, QuestionIcon } from "@phosphor-icons/react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useThrottledCallback } from "@tanstack/react-pacer";
import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useTheme } from "../../hooks/use-theme";
import { useWorkspaces } from "../../hooks/use-console-mutations";
import { ConsoleContext } from "./console-context";
import { ConsoleNavbar } from "./console-navbar";
import { DebugSidebar } from "./debug/sidebar";
import { PageList } from "./pages/list";
import { SettingsSidebar } from "./settings-sidebar";

const SIDEBAR_WIDTH = 280;

const getStoredWorkspaceId = (): string => {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return localStorage.getItem("verso_selected_workspace_id") ?? "";
  } catch {
    return "";
  }
};

const getStoredSpaceId = (): string => {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return localStorage.getItem("verso_selected_space_id") ?? "";
  } catch {
    return "";
  }
};

export const ConsoleLayout = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const routerState = useRouterState();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(getStoredWorkspaceId);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(getStoredSpaceId);
  const [debugSearch, setDebugSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.innerWidth >= 768;
  });
  const [activeTab, setActiveTab] = useState<"spaces" | "favorites" | "profile">("spaces");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);
  const { data: user } = useAuth();
  const { data: workspaces } = useWorkspaces();
  const currentWorkspace = workspaces?.find((w) => w.id === selectedWorkspaceId);

  // Persist selected workspace / space across route changes
  useEffect(() => {
    if (typeof window !== "undefined" && selectedWorkspaceId) {
      localStorage.setItem("verso_selected_workspace_id", selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (typeof window !== "undefined" && selectedSpaceId) {
      localStorage.setItem("verso_selected_space_id", selectedSpaceId);
    }
  }, [selectedSpaceId]);

  const isDebugRoute = routerState.location.pathname === "/home/debug";
  const isSettingsRoute = routerState.location.pathname.startsWith("/settings");
  const isProfileRoute = routerState.location.pathname === "/settings/account/profile";
  const isPreferencesRoute = routerState.location.pathname === "/settings/account/preferences";
  const isWorkspaceRoute = routerState.location.pathname === "/settings/workspace";
  const isMembersRoute = routerState.location.pathname === "/settings/members";
  const isSpacesRoute = routerState.location.pathname === "/settings/spaces";
  const debugSelectedTable =
    ((routerState.location.search as Record<string, unknown> | undefined)?.table as string) ?? null;

  const isSpecialRoute = isDebugRoute || isSettingsRoute;

  useEffect(() => {
    if (mainRef.current) {
      if (isSpecialRoute) {
        gsap.fromTo(
          mainRef.current,
          { opacity: 0, x: 20 },
          { duration: 0.2, ease: "power2.out", opacity: 1, x: 0 },
        );
      } else {
        gsap.set(mainRef.current, { clearProps: "all" });
      }
    }
    if (sidebarContentRef.current) {
      if (isSpecialRoute) {
        gsap.fromTo(
          sidebarContentRef.current,
          { opacity: 0 },
          { duration: 0.2, ease: "power2.out", opacity: 1 },
        );
      } else {
        gsap.set(sidebarContentRef.current, { clearProps: "all" });
      }
    }
  }, [isSpecialRoute]);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const toggleSidebar = useThrottledCallback(
    () => {
      if (animatingRef.current || !sidebarRef.current) {
        return;
      }
      animatingRef.current = true;
      const open = !sidebarOpen;
      setSidebarOpen(open);
      gsap.to(sidebarRef.current, {
        duration: 0.25,
        ease: "power2.inOut",
        onComplete: () => {
          animatingRef.current = false;
        },
        opacity: open ? 1 : 0,
        paddingLeft: open ? 16 : 0,
        paddingRight: open ? 16 : 0,
        width: open ? SIDEBAR_WIDTH : 0,
      });
    },
    { wait: 300 },
  );

  useEffect(() => {
    if (sidebarRef.current) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      gsap.set(sidebarRef.current, {
        opacity: isMobile ? 0 : 1,
        paddingLeft: isMobile ? 0 : 16,
        paddingRight: isMobile ? 0 : 16,
        width: isMobile ? 0 : SIDEBAR_WIDTH,
      });
    }
  }, []);

  const handleDebugBack = useCallback(() => {
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => navigate({ to: "/home" }),
        opacity: 0,
        x: -20,
      });
    } else {
      navigate({ to: "/home" });
    }
  }, [navigate]);

  const handleSettingsBack = useCallback(() => {
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => navigate({ to: "/home" }),
        opacity: 0,
        x: -20,
      });
    } else {
      navigate({ to: "/home" });
    }
  }, [navigate]);

  let sidebarContent: React.ReactNode;
  if (isDebugRoute) {
    sidebarContent = (
      <DebugSidebar
        onBack={handleDebugBack}
        onSearchChange={setDebugSearch}
        onSelectTable={(table) => navigate({ search: { table }, to: "/home/debug" })}
        searchQuery={debugSearch}
        selectedTable={debugSelectedTable}
      />
    );
  } else if (isSettingsRoute) {
    sidebarContent = (
      <SettingsSidebar
        currentWorkspaceName={currentWorkspace?.name}
        isMembersRoute={isMembersRoute}
        isPreferencesRoute={isPreferencesRoute}
        isProfileRoute={isProfileRoute}
        isSpacesRoute={isSpacesRoute}
        isWorkspaceRoute={isWorkspaceRoute}
        onBack={handleSettingsBack}
        userIsOwner={user?.isOwner}
      />
    );
  } else {
    sidebarContent = (
      <div className="min-h-0 w-62 flex-1 flex flex-col overflow-y-auto">
        <div
          className={`mb-3 flex items-center justify-center gap-2 border-b pb-2 text-[11px] lowercase ${t("border-border-dark", "border-border-light")}`}
        >
          <button
            className={`${activeTab === "spaces" ? t("text-text-dark border-b", "text-text-light border-b") : ""} ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
            onClick={() => setActiveTab("spaces")}
            type="button"
          >
            spaces
          </button>
          <span className={t("text-text-dark/20", "text-text-light/20")}>|</span>
          <button
            className={`${activeTab === "favorites" ? t("text-text-dark border-b", "text-text-light border-b") : ""} ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
            onClick={() => setActiveTab("favorites")}
            type="button"
          >
            favorites
          </button>
          <span className={t("text-text-dark/20", "text-text-light/20")}>|</span>
          <button
            className={`${activeTab === "profile" ? t("text-text-dark border-b", "text-text-light border-b") : ""} ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            profile
          </button>
        </div>
        <PageList
          onSelectPage={(id) => setSelectedPageId(id)}
          onSelectSpace={setSelectedSpaceId}
          onSelectWorkspace={setSelectedWorkspaceId}
          selectedPageId={selectedPageId}
          selectedSpaceId={selectedSpaceId}
          selectedWorkspaceId={selectedWorkspaceId}
        />
      </div>
    );
  }

  return (
    <ConsoleContext.Provider
      value={{
        selectedPageId,
        selectedSpaceId,
        selectedWorkspaceId,
        setSelectedPageId,
        setSelectedSpaceId,
        setSelectedWorkspaceId,
      }}
    >
      <div
        className={`flex min-h-screen flex-col transition-colors duration-500 ease-out ${t("bg-bg-dark", "bg-bg-light")}`}
      >
        <ConsoleNavbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        <div className="relative flex flex-1 overflow-hidden">
          <aside
            ref={sidebarRef}
            className={`absolute inset-y-0 left-0 z-40 md:relative md:shrink-0 flex flex-col border-r overflow-hidden p-4 transition-colors duration-500 ease-out ${t("border-border-dark", "border-border-light")} ${isDarkMode ? "bg-[#171717]" : "bg-[#e8e8e8]"}`}
          >
            <div className="min-h-0 flex-1 flex flex-col" ref={sidebarContentRef}>
              {sidebarContent}
            </div>

            <div
              className={`mt-2 w-62 space-y-2 border-t pt-2 ${t("border-border-dark", "border-border-light")}`}
            >
              <button
                className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
                type="button"
              >
                <QuestionIcon size={12} />
                help
              </button>
              <button
                className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${isSettingsRoute ? t("text-text-dark", "text-text-light") : t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
                onClick={() => navigate({ to: "/settings/account/profile" })}
                type="button"
              >
                <GearSixIcon size={12} />
                <span className={isSettingsRoute ? "border-b" : ""}>settings</span>
              </button>
              <button
                className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${isDebugRoute ? t("text-text-dark", "text-text-light") : t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
                onClick={() => navigate({ search: { table: undefined }, to: "/home/debug" })}
                type="button"
              >
                <DatabaseIcon size={12} />
                <span className={isDebugRoute ? "border-b" : ""}>debug database</span>
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
          </aside>

          <main className="min-h-0 flex-1 overflow-y-auto relative" ref={mainRef}>
            <Outlet />
          </main>
        </div>
      </div>
    </ConsoleContext.Provider>
  );
};
