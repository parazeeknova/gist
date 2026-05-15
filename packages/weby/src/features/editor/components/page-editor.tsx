import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef, useState } from "react";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { useTheme } from "#/shared/hooks/use-theme";
import { getEditorExtensions } from "#/features/editor/extensions";
import { useEditorContent } from "#/features/editor/hooks/use-editor-content";
import { FixedToolbar } from "#/features/editor/components/toolbar/fixed-toolbar";
import { BubbleMenu } from "#/features/editor/components/toolbar/bubble-menu";
import { EditorMoreMenu } from "#/features/editor/components/editor-more-menu";
import {
  useIsPageFavorited,
  useTogglePageFavorite,
} from "#/features/console/hooks/use-page-favorites";
import { setFlashToast } from "#/features/console/components/flash-toast";
import { useIsPageWatching, useWatchPage } from "#/features/console/hooks/use-page-watches";
import type { PageEditorProps } from "#/features/editor/types/editor.types";

export const PageEditor = ({
  pageId,
  contentJson,
  editable,
  title,
  spaceName,
  spaceSlug,
  creatorId,
  createdAt,
  updatedAt,
  textContent,
}: PageEditorProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const parseContent = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.type === "doc" &&
        Array.isArray(parsed.content)
      ) {
        return parsed;
      }
    } catch {
      // fall through
    }
    return { content: [], type: "doc" };
  }, []);

  const markDirtyRef = useRef<(() => void) | null>(null);

  const editor = useEditor({
    content: parseContent(contentJson),
    editable,
    editorProps: {
      attributes: {
        class: "outline-none border-none focus:outline-none focus:border-none focus:ring-0",
      },
    },
    extensions: getEditorExtensions(),
    immediatelyRender: false,
    onUpdate: () => {
      if (editable) {
        markDirtyRef.current?.();
      }
    },
  });

  const { dirty, cleanup, isSaving, lastSaved, markDirty } = useEditorContent(editor, pageId);
  const { data: favData } = useIsPageFavorited(pageId);
  const toggleFav = useTogglePageFavorite();
  const isFaved = favData?.favorited ?? false;
  const { data: watchData } = useIsPageWatching(pageId);
  const watchPage = useWatchPage();
  const isWatching = watchData?.watching ?? false;

  const [fullWidth, setFullWidth] = useState(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      return localStorage.getItem("verso-editor-fullwidth") === "true";
    } catch {
      return false;
    }
  });

  const toggleFullWidth = useCallback(() => {
    setFullWidth((prev) => {
      const next = !prev;
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          localStorage.setItem("verso-editor-fullwidth", String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const contentRef = useRef<HTMLDivElement>(null);

  const handleContentClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (!editor || !editable) {
        return;
      }
      const target = e.target as HTMLElement;
      const proseEl = contentRef.current;
      if (!proseEl) {
        return;
      }
      // Only focus at end if clicking the container itself (blank area)
      if (target === proseEl || !proseEl.contains(target)) {
        editor.commands.focus("end");
      }
    },
    [editor, editable],
  );

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: Date | null) => {
    if (!date) {
      return "";
    }
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) {
      return "just now";
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  markDirtyRef.current = markDirty;

  const previousContentJsonRef = useRef(contentJson);

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (previousContentJsonRef.current === contentJson) {
      return;
    }
    previousContentJsonRef.current = contentJson;
    const nextContent = parseContent(contentJson);
    editor.commands.setContent(nextContent);
  }, [contentJson, editor, parseContent]);

  useEffect(() => () => cleanup(), [cleanup]);

  if (!editor) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="h-full flex flex-col pb-16">
      <div className="flex items-center justify-between pt-1.5 pb-1 pl-4 pr-4 shrink-0">
        <div className="group relative">
          <span
            className={`text-[11px] lowercase font-medium ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            {title}
          </span>
          <div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden group-hover:block">
            <div
              className={`relative whitespace-nowrap px-2 py-1 text-[10px] ${t("bg-neutral-800 text-white", "bg-neutral-200 text-black")}`}
            >
              {title}
              <div
                className={`absolute left-2 bottom-full h-1 w-1 rotate-45 ${t("bg-neutral-800", "bg-neutral-200")}`}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editable && (
            <span
              className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}
            >
              {(() => {
                if (isSaving) {
                  return "saving...";
                }
                if (dirty) {
                  return "unsaved changes";
                }
                return `saved ${formatTimeAgo(lastSaved)}`;
              })()}
            </span>
          )}
          <button
            className={`p-0.5 transition-colors ${isFaved ? "text-yellow-400" : t("text-text-dark/40 hover:text-text-dark", "text-text-light/40 hover:text-text-light")}`}
            onClick={() => toggleFav.mutate(pageId)}
            type="button"
          >
            <BookmarkSimpleIcon size={14} weight={isFaved ? "fill" : "regular"} />
          </button>
          <EditorMoreMenu
            pageId={pageId}
            title={title}
            spaceName={spaceName}
            spaceSlug={spaceSlug}
            creatorId={creatorId}
            createdAt={createdAt}
            updatedAt={updatedAt}
            textContent={textContent}
            fullWidth={fullWidth}
            onToggleFullWidth={toggleFullWidth}
            isWatching={isWatching}
            onToggleWatch={() =>
              watchPage.mutate(pageId, {
                onSuccess: (data) => {
                  setFlashToast(data.watching ? "watching page" : "stopped watching");
                },
              })
            }
            watchPending={watchPage.isPending}
          />
        </div>
      </div>
      {editable && (
        <>
          <div className={`w-full px-4 shrink-0 ${fullWidth ? "" : "mx-auto max-w-2xl"}`}>
            <FixedToolbar editor={editor} />
          </div>
          <BubbleMenu editor={editor} />
        </>
      )}
      <div
        ref={contentRef}
        className={`w-full px-4 blog-reader-prose flex-1 min-h-0 overflow-y-auto ${fullWidth ? "" : "mx-auto max-w-2xl"}`}
        onClick={handleContentClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleContentClick(e);
          }
        }}
        aria-label="page content"
        aria-multiline="true"
        role="textbox"
        tabIndex={0}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
