import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import { getEditorExtensions } from "#/features/editor/extensions";
import { useEditorContent } from "#/features/editor/hooks/use-editor-content";
import { FixedToolbar } from "#/features/editor/components/toolbar/fixed-toolbar";
import { BubbleMenu } from "#/features/editor/components/toolbar/bubble-menu";
import type { PageEditorProps } from "#/features/editor/types/editor.types";

export const PageEditor = ({ pageId, contentJson, editable, title }: PageEditorProps) => {
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

  const { dirty, cleanup, markDirty } = useEditorContent(editor, pageId);

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
      <div className="px-4 mb-3 shrink-0">
        <span
          className={`text-[11px] lowercase font-medium ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          {title}
        </span>
        {editable && dirty && (
          <span className={`ml-2 text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
            unsaved
          </span>
        )}
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
