import { DatabaseIcon, GearSixIcon, QuestionIcon } from "@phosphor-icons/react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { gsap } from "gsap";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/use-theme";
import { ConsoleNavbar } from "./console-navbar";
import { DebugSidebar } from "./debug-sidebar";
import { PageList } from "./page-list";

const SIDEBAR_WIDTH = 280;

interface ConsoleContextValue {
  selectedPageId: string | null;
  setSelectedPageId: (id: string | null) => void;
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: (id: string) => void;
  selectedSpaceId: string;
  setSelectedSpaceId: (id: string) => void;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export const useConsoleContext = () => {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error("useConsoleContext must be used within ConsoleLayout");
  }
  return ctx;
};

export const ConsoleLayout = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
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

  const isDebugRoute = routerState.location.pathname === "/home/debug";
  const debugSelectedTable =
    ((routerState.location.search as Record<string, unknown> | undefined)?.table as string) ?? null;
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const toggleSidebar = useCallback(() => {
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
      width: open ? SIDEBAR_WIDTH : 0,
    });
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarRef.current) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      gsap.set(sidebarRef.current, {
        opacity: isMobile ? 0 : 1,
        width: isMobile ? 0 : SIDEBAR_WIDTH,
      });
    }
  }, []);

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
            {isDebugRoute ? (
              <DebugSidebar
                onBack={() => navigate({ to: "/home" })}
                onSearchChange={setDebugSearch}
                onSelectTable={(table) => navigate({ search: { table }, to: "/home/debug" })}
                searchQuery={debugSearch}
                selectedTable={debugSelectedTable}
              />
            ) : (
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
            )}

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
                className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
                type="button"
              >
                <GearSixIcon size={12} />
                settings
              </button>
              <button
                className={`flex w-full items-center gap-2 px-1 text-[11px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
                onClick={() => navigate({ search: { table: undefined }, to: "/home/debug" })}
                type="button"
              >
                <DatabaseIcon size={12} />
                debug database
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

          <main className="min-h-0 flex-1 overflow-y-auto relative">
            <Outlet />
          </main>
        </div>
      </div>
    </ConsoleContext.Provider>
  );
};
