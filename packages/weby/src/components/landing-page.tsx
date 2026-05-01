import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../hooks/use-theme";
import {
  ArrowRightIcon,
  BellIcon,
  GitForkIcon,
  MagnifyingGlassIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";

interface GradientTextProps {
  as?: "h1" | "h2" | "h3" | "span";
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

const GradientText = ({
  as: Tag = "h2",
  children,
  className = "",
  from,
  via,
  to,
}: GradientTextProps) => {
  const { isDarkMode } = useTheme();
  const top = from ?? (isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)");
  const mid = via ?? (isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)");
  const bot = to ?? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.15)");

  return (
    <Tag
      className={className}
      style={{
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        backgroundImage: `linear-gradient(0deg, ${top} 0%, ${mid} 40%, ${bot} 100%)`,
      }}
    >
      {children}
    </Tag>
  );
};

const FEATURES = [
  {
    desc: "runs on your own infrastructure. air-gap compatible. your data never leaves your server.",
    label: "self-hosted",
  },
  {
    desc: "multiple users edit the same page simultaneously. crdt-based, conflict-free merging.",
    label: "real-time sync",
  },
  {
    desc: "separate workspaces per team or project. granular access control at every level.",
    label: "spaces & permissions",
  },
  {
    desc: "structure your knowledge to any depth. drag & drop to reorganize entire hierarchies.",
    label: "nested pages",
  },
  {
    desc: "discuss in context. resolve threads. keep the full history of every conversation.",
    label: "inline comments",
  },
  {
    desc: "AGPL licensed. fork it, modify it, audit every line. no vendor lock-in ever.",
    label: "open source",
  },
];

export const LandingPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showFixedNav, setShowFixedNav] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  useEffect(() => {
    const onScroll = () => setShowFixedNav(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            gsap.fromTo(
              entry.target,
              { opacity: 0, y: 20 },
              { duration: 0.5, ease: "power2.out", opacity: 1, y: 0 },
            );
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    for (const el of sections) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (showFixedNav) {
      gsap.fromTo(
        ".fixed-nav-inner",
        { opacity: 0, y: -8 },
        { duration: 0.15, ease: "power2.out", opacity: 1, y: 0 },
      );
    }
  }, [showFixedNav]);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ease-out ${t("bg-bg-dark text-text-dark", "bg-bg-light text-text-light")}`}
    >
      {/* Fixed scroll nav */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 pt-3 transition-transform duration-200 ease-out ${showFixedNav ? "translate-y-0" : "-translate-y-full"}`}
      >
        <nav
          className={`fixed-nav-inner mx-auto max-w-180 px-4 sm:px-6 flex items-center justify-between border py-2 text-[13px] ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
        >
          <a className="flex items-center gap-2 lowercase" href="/">
            <img alt="verso" className="h-4 w-4" src="/verso.svg" />
            verso
          </a>
          <div className="flex items-center gap-3">
            <a className="lowercase" href="https://github.com/parazeeknova/verso">
              github
            </a>
            <button
              className={t(
                "text-text-dark/30 hover:text-text-dark/60",
                "text-text-light/30 hover:text-text-light/60",
              )}
              onClick={toggleTheme}
              type="button"
            >
              {isDarkMode ? "light" : "dark"}
            </button>
          </div>
        </nav>
      </div>

      {/* === Markdown Document Body === */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        {/* Inline nav / header bar */}
        <div
          className={`flex items-center justify-between border-b pb-3 mb-10 text-[13px] ${t("border-border-dark", "border-border-light")}`}
        >
          <a className="flex items-center gap-2 lowercase" href="/">
            <img alt="verso" className="h-4 w-4" src="/verso.svg" />
            verso
          </a>
          <div className="flex items-center gap-4 lowercase">
            <a href="https://github.com/parazeeknova/verso">github</a>
            <button
              className={t(
                "text-text-dark/30 hover:text-text-dark/60",
                "text-text-light/30 hover:text-text-light/60",
              )}
              onClick={toggleTheme}
              type="button"
            >
              {isDarkMode ? "light" : "dark"}
            </button>
          </div>
        </div>

        {/* # Hero heading */}
        <GradientText
          as="h1"
          className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1] lowercase"
        >
          # your wiki, your server.
          <br />
          your knowledge.
        </GradientText>

        <p
          className={`mt-5 text-[14px] leading-relaxed lowercase ${t("text-text-dark/60", "text-text-light/60")}`}
        >
          an open-source, self-hosted wiki and knowledge base. write, organize, and publish your
          thinking —{" "}
          <strong className={t("text-text-dark/80", "text-text-light/80")}>in real-time</strong>,
          with{" "}
          <strong className={t("text-text-dark/80", "text-text-light/80")}>full control</strong>{" "}
          over your data. no subscriptions. no lock-in. just yours.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className={`flex items-center gap-2 border px-5 py-2.5 text-[13px] lowercase transition-colors ${t("border-border-dark bg-text-dark text-bg-dark hover:bg-text-dark/90", "border-border-light bg-text-light text-bg-light hover:bg-text-light/90")}`}
            href="https://przknv.cc"
            target="_blank"
            rel="noopener noreferrer"
          >
            preview
            <ArrowRightIcon size={14} />
          </a>
          <a
            className={`border px-5 py-2.5 text-[13px] lowercase transition-colors ${t("border-border-dark hover:bg-white/5", "border-border-light hover:bg-black/5")}`}
            href="#self-hosted"
          >
            self-host it
          </a>
          <span
            className={`text-[11px] lowercase self-center ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            open-source alternative to notion and confluence
          </span>
        </div>

        {/* --- App preview --- */}
        <div className={`mt-12 border ${t("border-border-dark", "border-border-light")}`}>
          {/* Navbar */}
          <div
            className={`flex items-center gap-2 border-b px-2 py-1.5 text-[10px] ${t("border-border-dark", "border-border-light")}`}
          >
            <SidebarSimpleIcon className={t("text-text-dark/30", "text-text-light/30")} size={8} />
            <span className="lowercase">verso</span>
            <span className={t("text-text-dark/20", "text-text-light/20")}>/</span>
            <span className="lowercase">home</span>
            <span className={t("text-text-dark/20", "text-text-light/20")}>/</span>
            <span className="lowercase">public</span>
            <span className={t("text-text-dark/20", "text-text-light/20")}>/</span>
            <span className="lowercase">blogs</span>
            <div
              className={`mx-auto flex items-center gap-1 max-w-30 border-b px-1 py-0.5 ${t("border-border-dark/30", "border-border-light/30")}`}
            >
              <MagnifyingGlassIcon
                className={t("text-text-dark/20", "text-text-light/20")}
                size={8}
              />
              <span className={t("text-text-dark/25", "text-text-light/25")}>search</span>
            </div>
            <BellIcon className={t("text-text-dark/30", "text-text-light/30")} size={8} />
            <span className={t("text-text-dark/40", "text-text-light/40")}>@you</span>
          </div>

          {/* Body: sidebar + main */}
          <div className="flex min-h-65">
            {/* Sidebar */}
            <div
              className={`hidden sm:flex w-24 sm:w-32 shrink-0 border-r flex-col text-[10px] ${t("border-border-dark", "border-border-light")}`}
            >
              <div
                className={`flex items-center justify-center gap-1 border-b px-1 py-1.5 ${t("border-border-dark", "border-border-light")}`}
              >
                <span className={`lowercase ${t("text-text-dark/60", "text-text-light/60")}`}>
                  spaces
                </span>
                <span className={t("text-text-dark/20", "text-text-light/20")}>|</span>
                <span className={`lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
                  favs
                </span>
                <span className={t("text-text-dark/20", "text-text-light/20")}>|</span>
                <span className={`lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
                  me
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-1.5 space-y-1">
                  <div className={`lowercase ${t("text-text-dark/50", "text-text-light/50")}`}>
                    engineering
                  </div>
                  <div className={`lowercase pl-2 ${t("text-text-dark/35", "text-text-light/35")}`}>
                    handbook.md
                  </div>
                  <div className={`lowercase pl-2 ${t("text-text-dark/25", "text-text-light/25")}`}>
                    runbooks.md
                  </div>
                  <div className="mt-2 lowercase">api docs</div>
                  <div className={`lowercase pl-2 ${t("text-text-dark/25", "text-text-light/25")}`}>
                    rest.md
                  </div>
                  <div className="mt-2 lowercase">onboarding</div>
                </div>
                <div className={`border-t p-1.5 ${t("border-border-dark", "border-border-light")}`}>
                  <div className={`lowercase ${t("text-text-dark/25", "text-text-light/25")}`}>
                    help
                  </div>
                  <div className={`lowercase ${t("text-text-dark/25", "text-text-light/25")}`}>
                    settings
                  </div>
                </div>
              </div>
            </div>

            {/* Main: editor split */}
            <div className="flex-1 flex flex-col">
              <div
                className={`flex items-center justify-between border-b px-2 py-1 text-[9px] ${t("border-border-dark text-text-dark/30", "border-border-light text-text-light/30")}`}
              >
                <span>~/verso/engineering/handbook.md</span>
              </div>
              <div className="flex-1 grid grid-cols-2">
                {/* Source pane */}
                <div className={t("border-border-dark", "border-border-light")}>
                  <div
                    className={`border-b px-2 py-0.5 text-[8px] lowercase ${t("border-border-dark text-text-dark/25", "border-border-light text-text-light/25")}`}
                  >
                    source.md
                  </div>
                  <div className="p-2 text-[10px] leading-5">
                    {[
                      " 1  # handbook",
                      " 2",
                      " 3  welcome to the wiki",
                      " 4",
                      " 5  ## principles",
                      " 6",
                      " 7  - self-hosted",
                      " 8  - no external deps",
                      " 9  - docs as build step",
                      "10",
                      "11  ## runbooks",
                      "12",
                      "13  > see incidents.md",
                      "14  |",
                    ].map((line, i) => (
                      <div className={i === 13 ? "animate-pulse" : ""} key={i}>
                        <span className={t("text-text-dark/20", "text-text-light/20")}>
                          {line.slice(0, 2)}
                        </span>
                        <span className={t("text-text-dark/50", "text-text-light/50")}>
                          {line.slice(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Preview pane */}
                <div>
                  <div
                    className={`border-b px-2 py-0.5 text-[8px] lowercase ${t("border-border-dark text-text-dark/25", "border-border-light text-text-light/25")}`}
                  >
                    preview
                  </div>
                  <div className="p-2 text-[10px] leading-5 space-y-1.5">
                    <h3
                      className={`text-[11px] font-bold border-b pb-0.5 ${t("border-border-dark", "border-border-light")}`}
                    >
                      handbook
                    </h3>
                    <p className={t("text-text-dark/55", "text-text-light/55")}>
                      welcome to the wiki for the platform team.
                    </p>
                    <h4 className="text-[10px] font-bold lowercase">principles</h4>
                    <ul className="space-y-0">
                      <li className={`${t("text-text-dark/45", "text-text-light/45")}`}>
                        - self-hosted
                      </li>
                      <li className={`${t("text-text-dark/45", "text-text-light/45")}`}>
                        - no external deps
                      </li>
                      <li className={`${t("text-text-dark/45", "text-text-light/45")}`}>
                        - docs as build
                      </li>
                    </ul>
                    <h4 className="text-[10px] font-bold lowercase">runbooks</h4>
                    <blockquote
                      className={`border-l pl-1.5 ${t("border-border-dark text-text-dark/45", "border-border-light text-text-light/45")}`}
                    >
                      see incidents.md
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div
            className={`flex items-center justify-between border-t px-2 py-1 text-[8px] ${t("border-border-dark text-text-dark/20", "border-border-light text-text-light/20")}`}
          >
            <span>crdt &middot; utf-8</span>
            <span>3 editors online &middot; ln 14, col 1</span>
          </div>
        </div>

        {/* ## features */}
        <section id="features" className="mt-16">
          <GradientText as="h2" className="text-2xl sm:text-3xl font-bold lowercase mb-6">
            ## features
          </GradientText>
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            ref={(el) => {
              sectionRefs.current[0] = el;
            }}
          >
            {FEATURES.map((f) => (
              <div key={f.label}>
                <div
                  className={`border-b pb-2 mb-2 ${t("border-border-dark", "border-border-light")}`}
                >
                  <h3 className="text-sm lowercase font-bold">{f.label}</h3>
                </div>
                <p
                  className={`text-[12px] leading-relaxed lowercase ${t("text-text-dark/45", "text-text-light/45")}`}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ## self-hosted */}
        <section id="self-hosted" className="mt-16">
          <GradientText as="h2" className="text-2xl sm:text-3xl font-bold lowercase mb-6">
            ## self-hosted
          </GradientText>
          <div
            className="grid sm:grid-cols-5 gap-8"
            ref={(el) => {
              sectionRefs.current[1] = el;
            }}
          >
            <div className="sm:col-span-3 flex flex-col gap-3">
              <blockquote
                className={`border-l-2 pl-4 ${t("border-border-dark text-text-dark/60", "border-border-light text-text-light/60")}`}
              >
                <p className="leading-relaxed lowercase text-[14px]">
                  fully self-hosted.{" "}
                  <strong className={t("text-text-dark/80", "text-text-light/80")}>
                    air-gap compatible
                  </strong>
                  . zero external dependencies. run verso on a raspberry pi, your homelab, or your
                  enterprise cluster.
                </p>
              </blockquote>
              <blockquote
                className={`border-l-2 pl-4 ${t("border-border-dark text-text-dark/50", "border-border-light text-text-light/50")}`}
              >
                <p className="text-[12px] lowercase">your data never leaves your server.</p>
              </blockquote>
              <blockquote
                className={`border-l-2 pl-4 ${t("border-border-dark text-text-dark/40", "border-border-light text-text-light/40")}`}
              >
                <p className="text-[11px] lowercase">
                  deploy with a single docker compose command. no kubernetes required. no cloud
                  account needed. ships as two lightweight containers — the web frontend and the go
                  backend — both available on ghcr.
                </p>
              </blockquote>
              <blockquote
                className={`border-l-2 pl-4 ${t("border-border-dark text-text-dark/35", "border-border-light text-text-light/35")}`}
              >
                <p className="text-[11px] lowercase">
                  runs on amd64 and arm64. tested on raspberry pi 5, hetzner vps, and your laptop.
                </p>
              </blockquote>
            </div>
            <div
              className={`sm:col-span-2 border p-4 text-[12px] leading-6 ${t("border-border-dark bg-white/3", "border-border-light bg-black/3")}`}
            >
              <div
                className={`text-[10px] lowercase mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                ```sh
              </div>
              <div>
                <span className={t("text-text-dark/25", "text-text-light/25")}>$</span> git clone
                https://github.com/parazeeknova/verso
              </div>
              <div>
                <span className={t("text-text-dark/25", "text-text-light/25")}>$</span> cd verso
              </div>
              <div>
                <span className={t("text-text-dark/25", "text-text-light/25")}>$</span> cp
                .env.example .env
              </div>
              <div>
                <span className={t("text-text-dark/25", "text-text-light/25")}>$</span> docker
                compose -f docker/docker-compose.yml up -d
              </div>
              <div
                className={`text-[10px] lowercase mt-3 ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                ```
              </div>
            </div>
          </div>
        </section>

        {/* ## get started */}
        <section className="mt-16 pb-8">
          <GradientText
            as="h2"
            className="text-3xl sm:text-5xl font-bold leading-[1.08] lowercase mb-5"
          >
            ### no subscriptions.
            <br />
            no lock-in. just yours.
          </GradientText>
          <p className={`text-[13px] lowercase ${t("text-text-dark/50", "text-text-light/50")}`}>
            free, open source, AGPL licensed. set up in under two minutes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className={`flex items-center gap-2 border px-6 py-3 text-[13px] lowercase transition-colors ${t("border-border-dark bg-text-dark text-bg-dark hover:bg-text-dark/90", "border-border-light bg-text-light text-bg-light hover:bg-text-light/90")}`}
              href="/home"
            >
              start your wiki
              <ArrowRightIcon size={14} />
            </a>
            <a
              className={`flex items-center gap-2 border px-6 py-3 text-[13px] lowercase transition-colors ${t("border-border-dark hover:bg-white/5", "border-border-light hover:bg-black/5")}`}
              href="https://github.com/parazeeknova/verso"
            >
              <GitForkIcon size={14} />
              fork on github
            </a>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="pb-10 pt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 overflow-visible">
          <div className={`border-t ${t("border-border-dark", "border-border-light")}`} />
          <div className="flex flex-col items-center pt-12 pb-4">
            <div className="flex items-end gap-4 sm:gap-6">
              <img alt="verso" className="h-16 sm:h-24 lg:h-28 mb-2 opacity-80" src="/verso.svg" />
              <GradientText
                as="h2"
                className="text-8xl lg:text-[10em] font-bold tracking-tight lowercase"
              >
                verso
              </GradientText>
            </div>
            <p
              className={`mt-4 text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
            >
              open source &middot; self-hosted &middot; yours
            </p>
            <p
              className={`mt-1 text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
            >
              &copy; {new Date().getFullYear()} verso. MIT licensed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
