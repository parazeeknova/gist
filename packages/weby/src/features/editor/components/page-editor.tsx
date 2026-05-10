import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import { getEditorExtensions } from "#/features/editor/extensions";
import { useEditorContent } from "#/features/editor/hooks/use-editor-content";
import { FixedToolbar } from "#/features/editor/components/toolbar/fixed-toolbar";
import { BubbleMenu } from "#/features/editor/components/toolbar/bubble-menu";
import type { PageEditorProps } from "#/features/editor/types/editor.types";

export const PageEditor = ({ pageId, contentJson, editable }: PageEditorProps) => {
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
    extensions: getEditorExtensions(),
    immediatelyRender: false,
    onUpdate: () => {
      if (editable) {
        markDirtyRef.current?.();
      }
    },
  });

  const { dirty, cleanup, markDirty, isSaving } = useEditorContent(editor, pageId);

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
    <div ref={wrapperRef} className="mx-auto max-w-2xl px-4 pb-16">
      {editable && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px]">
              {dirty && (
                <span className={t("text-text-dark/40", "text-text-light/40")}>
                  unsaved changes
                </span>
              )}
              {isSaving && (
                <span className={t("text-text-dark/40", "text-text-light/40")}>saving...</span>
              )}
            </div>
          </div>
          <FixedToolbar editor={editor} />
          <BubbleMenu editor={editor} />
        </>
      )}
      <div
        className={`blog-reader-prose min-h-[60vh] rounded border p-4 ${t(
          "border-border-dark",
          "border-border-light",
        )}`}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
