import { BugIcon, GearSixIcon, QuestionIcon } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/use-theme";
import { ConsoleHome } from "./console-home";
import { ConsoleNavbar } from "./console-navbar";
import { PageDetail } from "./page-detail";
import { PageList } from "./page-list";

const SIDEBAR_WIDTH = 280;

export const ConsoleLayout = () => {
  const { isDarkMode } = useTheme();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.innerWidth >= 768;
  });
  const [activeTab, setActiveTab] = useState<"spaces" | "favorites" | "profile">("spaces");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

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

  const handlePageDeleted = useCallback(() => {
    setSelectedPageId(null);
  }, []);

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
    <div
      className={`flex min-h-screen flex-col transition-colors duration-500 ease-out ${t("bg-bg-dark", "bg-bg-light")}`}
    >
      <ConsoleNavbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

      <div className="relative flex flex-1 overflow-hidden">
        <aside
          ref={sidebarRef}
          className={`absolute inset-y-0 left-0 z-40 md:relative md:shrink-0 flex flex-col border-r overflow-hidden p-4 transition-colors duration-500 ease-out ${t("border-border-dark", "border-border-light")} ${isDarkMode ? "bg-[#171717]" : "bg-[#e8e8e8]"}`}
        >
          <div className="min-h-0 w-70 flex-1 flex flex-col overflow-y-auto">
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
              activeTab={activeTab}
              onSelectPage={(id) => setSelectedPageId(id)}
              selectedPageId={selectedPageId}
              selectedSpaceId={selectedSpaceId}
              onSelectSpace={setSelectedSpaceId}
            />
          </div>
          <div
            className={`mt-2 w-70 space-y-2 border-t pt-2 ${t("border-border-dark", "border-border-light")}`}
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
              type="button"
            >
              <BugIcon size={12} />
              debug
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
          {selectedPageId ? (
            <PageDetail pageId={selectedPageId} onDeleted={handlePageDeleted} />
          ) : (
            <ConsoleHome />
          )}
        </main>
      </div>
    </div>
  );
};
