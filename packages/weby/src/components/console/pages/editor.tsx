// eslint-disable-next-line import/no-named-as-default
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useCallback, useRef, useState } from "react";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { HeadingWithIds } from "../../blog/tiptap-heading-ids";
import { Link } from "@tiptap/extension-link";
import { useTheme } from "#/hooks/use-theme";
import { useUpdatePage } from "#/hooks/use-console-mutations";
import type { ConsolePageDetail } from "#/types";

const lowlight = createLowlight(common);

interface PageEditorProps {
  page: ConsolePageDetail;
}

export const PageEditor = ({ page }: PageEditorProps) => {
  const { isDarkMode } = useTheme();
  const updatePage = useUpdatePage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirty, setDirty] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const parseContent = useCallback((contentJson: string) => {
    try {
      const parsed = JSON.parse(contentJson);
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

  const editor = useEditor({
    content: parseContent(page.contentJson),
    editable: true,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
        link: false,
      }),
      HeadingWithIds.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
        openOnClick: false,
      }),
      CodeBlockLowlight.configure({
        defaultLanguage: "plaintext",
        lowlight,
      }),
    ],
    immediatelyRender: false,
    onUpdate: () => {
      setDirty(true);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (!editor) {
          return;
        }
        const json = editor.getJSON();
        const text = editor.getText();
        updatePage.mutate(
          {
            id: page.id,
            input: {
              contentJson: JSON.stringify(json),
              textContent: text,
            },
          },
          {
            onSuccess: () => setDirty(false),
          },
        );
      }, 1500);
    },
  });

  // Update editor content when page changes externally
  useEffect(() => {
    if (!editor) {
      return;
    }
    const nextContent = parseContent(page.contentJson);
    const currentJson = JSON.stringify(editor.getJSON());
    if (JSON.stringify(nextContent) !== currentJson) {
      editor.commands.setContent(nextContent);
    }
  }, [page.id, page.contentJson, editor, parseContent]);

  // Cleanup debounce on unmount
  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    [],
  );

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
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="mb-4 flex items-center justify-between">
        <h2 className={`text-lg font-medium ${t("text-text-dark", "text-text-light")}`}>
          {page.title}
        </h2>
        <div className="flex items-center gap-2 text-[11px]">
          {dirty && (
            <span className={t("text-text-dark/40", "text-text-light/40")}>unsaved changes</span>
          )}
          {updatePage.isPending && (
            <span className={t("text-text-dark/40", "text-text-light/40")}>saving...</span>
          )}
        </div>
      </header>
      <div
        ref={wrapperRef}
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
