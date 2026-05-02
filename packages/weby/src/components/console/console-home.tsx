import { FileTextIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ConsolePage } from "#/types";
import { useAuth } from "../../hooks/use-auth";
import { useTheme } from "../../hooks/use-theme";
import { fetchProtected } from "../../hooks/fetch-protected";

const useConsolePages = () =>
  useQuery<ConsolePage[]>({
    queryFn: ({ signal }) => fetchProtected<ConsolePage[]>("/api/console/pages", { signal }),
    queryKey: ["consolePages"],
    staleTime: 30 * 1000,
  });

const subMessages = [
  "hope you're having a good day",
  "ready to build something ?",
  "what's on your mind today ?",
  "stay curious, stay building",
  "your second brain is here",
  "ideas don't wait, write them down",
  "let's make something cool",
  "back at it again huh",
  "coffee first, docs second",
  "your workspace misses you",
  "quiet time, loud ideas",
  "build in public, stay humble",
  "one doc at a time",
  "the void is staring back",
  "no pressure, just progress",
  "write it before you forget it",
  "consistency over intensity",
  "ship it when it's ready",
  "think deeply, write simply",
];

const placeholderSpaces: { id: string; label: string; desc: string }[] = [];

export const ConsoleHome = () => {
  const { data: user } = useAuth();
  const { isDarkMode } = useTheme();
  const { data: pages } = useConsolePages();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const subMessage = useMemo(() => subMessages[Math.floor(Math.random() * subMessages.length)], []);

  const mySpaces = placeholderSpaces;
  const recentDocs = [...(pages ?? [])]
    .toSorted((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-12">
      <h1 className={`text-lg lowercase ${t("text-text-dark", "text-text-light")}`}>
        welcome, @{user?.username}
      </h1>
      <p className={`mt-1 text-[12px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
        {subMessage}
      </p>

      <div className="mt-10">
        <p className={`mb-3 text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
          spaces you belong to
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mySpaces.length === 0 ? (
            <p
              className={`w-full text-center text-[13px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
            >
              no spaces yet
            </p>
          ) : (
            mySpaces.map((s) => (
              <button
                key={s.id}
                className={`w-40 shrink-0 rounded border px-3 py-2 text-left lowercase bg-linear-to-b ${t("border-border-dark from-white/3 to-transparent hover:bg-white/5", "border-border-light from-black/2 to-transparent hover:bg-black/3")}`}
                type="button"
              >
                <p className={`text-[13px] ${t("text-text-dark/70", "text-text-light/70")}`}>
                  {s.label}
                </p>
                <p className={`mt-0.5 text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}>
                  {s.desc}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`mt-8 border-t pt-5 ${t("border-border-dark", "border-border-light")}`}>
        <div className="flex items-center justify-between">
          <p className={`text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
            my docs
          </p>
          <div className="flex gap-2">
            <button
              className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
              type="button"
            >
              new doc
            </button>
            <span className={t("text-text-dark/20", "text-text-light/20")}>|</span>
            <button
              className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
              type="button"
            >
              view all
            </button>
          </div>
        </div>

        {recentDocs.length === 0 ? (
          <p
            className={`mt-6 text-center text-[13px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            no docs yet
          </p>
        ) : (
          <div className="mt-3 space-y-0.5">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-3 rounded px-2 py-1.5 ${t("hover:bg-white/5", "hover:bg-black/3")}`}
              >
                <FileTextIcon className={t("text-text-dark/30", "text-text-light/30")} size={14} />
                <span
                  className={`min-w-0 flex-1 truncate text-[13px] lowercase ${t("text-text-dark/60", "text-text-light/60")}`}
                >
                  {doc.title}
                </span>
                <span
                  className={`shrink-0 text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}
                >
                  {new Date(doc.updatedAt).toISOString().slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p
        className={`fixed bottom-0 left-0 right-0 z-30 md:absolute md:bottom-0 md:left-0 md:right-0 pb-4 pt-2 text-center text-[10px] lowercase ${t("bg-bg-dark/80 text-text-dark/20", "bg-bg-light/80 text-text-light/20")}`}
      >
        spotted a bug or have a suggestion ?{" "}
        <a
          className="underline hover:opacity-70"
          href="https://github.com/parazeeknova/verso/issues"
          rel="noopener noreferrer"
          target="_blank"
        >
          report it here
        </a>
      </p>
    </div>
  );
};
