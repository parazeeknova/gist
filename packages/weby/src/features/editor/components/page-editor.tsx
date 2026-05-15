import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef, useState } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import { getEditorExtensions } from "#/features/editor/extensions";
import { useEditorContent } from "#/features/editor/hooks/use-editor-content";
import { FixedToolbar } from "#/features/editor/components/toolbar/fixed-toolbar";
import { BubbleMenu } from "#/features/editor/components/toolbar/bubble-menu";
import { EditorMoreMenu } from "#/features/editor/components/editor-more-menu";
import type { PageEditorProps } from "#/features/editor/types/editor.types";

export const PageEditor = ({
  pageId,
  contentJson,
  editable,
  title,
  spaceName,
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

  useEffect(() => {
    if (!editor) {
      return;
    }
    const nextContent = parseContent(contentJson);
    const currentJson = JSON.stringify(editor.getJSON());
    if (JSON.stringify(nextContent) !== currentJson) {
      editor.commands.setContent(nextContent);
    }
  }, [pageId, contentJson, editor, parseContent]);

  useEffect(() => () => cleanup(), [cleanup]);

  // Collapse blank lines in code blocks
  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) {
      return;
    }
    const collapseBlankLines = () => {
      const codeLines = container.querySelectorAll(".ProseMirror-code-block .ProseMirror-line");
      for (const line of codeLines) {
        const el = line as HTMLElement;
        const text = el.textContent?.trim() ?? "";
        if (text === "") {
          el.style.height = "0";
          el.style.minHeight = "0";
          el.style.lineHeight = "0";
          el.style.fontSize = "0";
          el.style.margin = "0";
          el.style.padding = "0";
        }
      }
    };
    collapseBlankLines();
    const timers = [setTimeout(collapseBlankLines, 100), setTimeout(collapseBlankLines, 300)];
    const observer = new MutationObserver(() => collapseBlankLines());
    observer.observe(container, { childList: true, subtree: true });
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      observer.disconnect();
    };
  }, []);

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
          <EditorMoreMenu
            pageId={pageId}
            title={title}
            spaceName={spaceName}
            creatorId={creatorId}
            createdAt={createdAt}
            updatedAt={updatedAt}
            textContent={textContent}
          />
        </div>
      </div>
      {editable && (
        <>
          <div className="mx-auto max-w-2xl w-full px-4 shrink-0">
            <FixedToolbar editor={editor} />
          </div>
          <BubbleMenu editor={editor} />
        </>
      )}
      <div className="mx-auto max-w-2xl w-full px-4 blog-reader-prose flex-1 min-h-0 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
