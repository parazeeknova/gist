import { gsap } from "gsap";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useDebouncedState } from "@tanstack/react-pacer";
import { useEffect, useRef, useState } from "react";
import type { Stats } from "#/types";
import { useAuth, useAuthActions } from "#/hooks/use-auth";
import { useTheme } from "#/hooks/use-theme";
import { useWorkspaces } from "#/hooks/use-console-mutations";
import { useConsoleContext } from "./console-context";
import {
  BellIcon,
  GearSixIcon,
  ListIcon,
  MagnifyingGlassIcon,
  SidebarIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";

interface ConsoleNavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const NAV_ROUTES = [
  { href: "/home", label: "home" },
  { href: "/#projects", label: "public" },
  { href: "/#blogs", label: "blogs" },
  { href: "/#about", label: "about" },
] as const;

export const ConsoleNavbar = ({ onToggleSidebar, sidebarOpen }: ConsoleNavbarProps) => {
  const { data: user } = useAuth();
  const { logout } = useAuthActions();
  const { isDarkMode, toggleTheme } = useTheme();
  const { selectedWorkspaceId } = useConsoleContext();
  const { data: workspaces } = useWorkspaces();

  const selectedWorkspace = workspaces?.find((w) => w.id === selectedWorkspaceId);
  const workspaceName = selectedWorkspace?.name ?? user?.username ?? "...";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useDebouncedState("", {
    wait: 300,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery<Stats>({
    queryFn: async ({ signal }) => {
      const r = await fetch("/api/stats", { signal });
      if (!r.ok) {
        throw new Error("Failed to fetch stats");
      }
      return r.json() as Promise<Stats>;
    },
    queryKey: ["stats"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!dropdownOpen && !notiOpen && !mobileMenuOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen, notiOpen, mobileMenuOpen]);

  useEffect(() => {
    let el: HTMLDivElement | null = null;
    if (dropdownOpen) {
      el = dropdownRef.current;
    } else if (notiOpen) {
      el = notiRef.current;
    } else if (mobileMenuOpen) {
      el = mobileMenuRef.current;
    }
    if (!el) {
      return;
    }
    const inner = el.querySelector(":scope > div");
    if (inner) {
      gsap.fromTo(
        inner,
        { opacity: 0, scale: 0.98, y: -4 },
        { duration: 0.15, ease: "power2.out", opacity: 1, scale: 1, y: 0 },
      );
    }
  }, [dropdownOpen, notiOpen, mobileMenuOpen]);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const navLinkClass = (href: string) =>
    `lowercase ${currentPath === href ? t("text-text-dark border-b", "text-text-light border-b") : ""} ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`;

  const mobileLinkClass = (href: string) =>
    `block px-3 py-1.5 text-left text-[12px] lowercase ${currentPath === href ? t("text-text-dark border-b-transparent", "text-text-light border-b-transparent") : ""} ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`;

  return (
    <nav
      className={`sticky top-0 z-50 flex h-10 items-center gap-3 border-b px-3 text-[13px] transition-colors duration-500 ease-out ${t("border-border-dark", "border-border-light")} ${isDarkMode ? "bg-text-light" : "bg-[#e5e5e5]"}`}
    >
      {/* Left: sidebar toggle + brand + desktop nav links */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          className={`flex items-center lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
          onClick={onToggleSidebar}
          type="button"
        >
          {sidebarOpen ? <SidebarSimpleIcon size={14} /> : <SidebarIcon size={14} />}
        </button>
        <a
          className={`flex items-center gap-1.5 lowercase mr-1 md:mr-3 ${t("text-text-dark/70 hover:text-text-dark", "text-text-light/70 hover:text-text-light")}`}
          href="/"
        >
          <img alt="verso" className="h-3.5 w-3.5" src="/verso.svg" />
          verso
        </a>
        {NAV_ROUTES.map((route, i) => [
          i > 0 ? (
            <span
              className={`hidden md:inline ${t("text-text-dark/20", "text-text-light/20")}`}
              key={`sep-${route.href}`}
            >
              /
            </span>
          ) : null,
          <a
            className={`hidden md:inline ${navLinkClass(route.href)}`}
            href={route.href}
            key={route.href}
          >
            {route.label}
          </a>,
        ])}
      </div>

      {/* Middle: search */}
      <div className="mx-auto flex w-full max-w-40 md:max-w-md items-center gap-2">
        <MagnifyingGlassIcon className={t("text-text-dark/20", "text-text-light/20")} size={12} />
        <input
          aria-label="Search"
          className={`w-full bg-transparent py-1 text-[13px] lowercase outline-none ${t("placeholder:text-text-dark/20", "placeholder:text-text-light/20")}`}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search"
          style={{
            borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
          }}
          type="text"
          value={searchQuery}
        />
      </div>

      {/* Right: notification + profile dropdown + mobile hamburger */}
      <div className="flex items-center gap-3">
        {/* Theme toggle — desktop only */}
        <button
          aria-label="Toggle theme"
          className={`hidden md:block lowercase ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
          onClick={toggleTheme}
          type="button"
        >
          {isDarkMode ? "light" : "dark"}
        </button>

        {/* Notification dropdown */}
        <div className="relative" ref={notiRef}>
          <button
            className={`flex items-center gap-1 lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
            onClick={() => setNotiOpen((o) => !o)}
            type="button"
          >
            <BellIcon size={12} />
          </button>

          {notiOpen && (
            <div
              className={`absolute right-0 top-full z-50 mt-1 w-52 border shadow-xl ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
            >
              <div className="py-1">
                <div
                  className={`flex items-center justify-between border-b px-3 pb-1.5 pt-1 ${t("border-border-dark", "border-border-light")}`}
                >
                  <span className={`text-[12px] ${t("text-text-dark/70", "text-text-light/70")}`}>
                    notifications
                  </span>
                  <button
                    className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
                    type="button"
                  >
                    clear all
                  </button>
                </div>
                <p
                  className={`px-3 py-2 text-[11px] ${t("text-text-dark/30", "text-text-light/30")}`}
                >
                  no notifications yet !
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className={`flex items-center gap-1 lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
            onClick={() => setDropdownOpen((o) => !o)}
            type="button"
          >
            {workspaceName}
          </button>

          {dropdownOpen && (
            <div
              className={`absolute right-0 top-full z-50 mt-1 w-52 border shadow-xl ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
            >
              <div className="py-1">
                {/* Workspace actions */}
                <button
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
                  onClick={() => setDropdownOpen(false)}
                  type="button"
                >
                  <GearSixIcon size={12} />
                  workspace settings
                </button>
                <button
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
                  onClick={() => setDropdownOpen(false)}
                  type="button"
                >
                  <UsersIcon size={12} />
                  manage members
                </button>

                {/* User details */}
                <div
                  className={`border-y my-1 px-3 pb-2 pt-1.5 ${t("border-border-dark", "border-border-light")}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] truncate ${t("text-text-dark", "text-text-light")}`}>
                      {user?.name || user?.username}
                    </p>
                    <p
                      className={`text-[10px] shrink-0 truncate max-w-20 ${t("text-text-dark/40", "text-text-light/40")}`}
                    >
                      @{user?.username}
                    </p>
                  </div>
                  <p className={`text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}>
                    {user?.email}
                  </p>
                  {stats && (
                    <p
                      className={`mt-1 text-[11px] ${t("text-text-dark/20", "text-text-light/20")}`}
                    >
                      pg {stats.pages} &middot; pts {stats.posts} &middot; rmd {stats.readmes}
                    </p>
                  )}
                </div>

                {/* Profile actions */}
                <button
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
                  onClick={() => setDropdownOpen(false)}
                  type="button"
                >
                  <UserIcon size={12} />
                  my profile
                </button>
                <button
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
                  onClick={() => setDropdownOpen(false)}
                  type="button"
                >
                  <SlidersHorizontalIcon size={12} />
                  my preferences
                </button>

                <div className={`border-t ${t("border-border-dark", "border-border-light")}`}>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] lowercase text-red-400 hover:bg-red-400/5"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    type="button"
                  >
                    <SignOutIcon size={12} />
                    logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hamburger menu */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            className={`flex items-center ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
            onClick={() => setMobileMenuOpen((o) => !o)}
            type="button"
          >
            <ListIcon size={14} />
          </button>

          {mobileMenuOpen && (
            <div
              className={`absolute right-0 top-full z-50 mt-1 w-28 border shadow-xl ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
            >
              <div className="py-1">
                {NAV_ROUTES.map((route) => (
                  <a
                    className={mobileLinkClass(route.href)}
                    href={route.href}
                    key={route.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {route.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
