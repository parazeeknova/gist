// eslint-disable-next-line import/no-named-as-default
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface ReadonlyBlogEditorProps {
  html: string;
}

export const ReadonlyBlogEditor = ({ html }: ReadonlyBlogEditorProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    content: html,
    editable: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        defaultLanguage: "plaintext",
        lowlight,
      }),
    ],
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.commands.setContent(html);
  }, [editor, html]);

  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) {
      return;
    }

    const collapseBlankLines = () => {
      // Collapse blank lines in code blocks
      const codeLines = container.querySelectorAll(".ProseMirror-code-block .ProseMirror-line");
      for (const line of codeLines) {
        const element = line as HTMLElement;
        const text = element.textContent?.trim() ?? "";
        if (text === "") {
          element.style.height = "0";
          element.style.minHeight = "0";
          element.style.lineHeight = "0";
          element.style.fontSize = "0";
          element.style.margin = "0";
          element.style.padding = "0";
        }
      }
    };

    // Initial collapse
    collapseBlankLines();
    const timers = [
      setTimeout(collapseBlankLines, 100),
      setTimeout(collapseBlankLines, 300),
      setTimeout(collapseBlankLines, 500),
    ];

    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(() => {
      collapseBlankLines();
    });

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
    <div ref={wrapperRef} className="blog-reader-prose">
      <EditorContent editor={editor} />
    </div>
  );
};
