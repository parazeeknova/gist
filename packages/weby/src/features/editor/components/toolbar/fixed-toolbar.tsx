import {
  TextBolderIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  CodeIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  CheckSquareIcon,
  CodeBlockIcon,
  QuotesIcon,
  MinusIcon,
  TableIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  TextAlignJustifyIcon,
  HighlighterIcon,
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react";
import type { ToolbarProps } from "#/features/editor/types/editor.types";
import { useTheme } from "#/shared/hooks/use-theme";

const toolbarButton = (t: (dark: string, light: string) => string, active: boolean | undefined) =>
  `p-1 cursor-pointer ${active ? t("bg-white/15 text-text-dark", "bg-black/10 text-text-light") : t("text-text-dark/40 hover:text-text-dark hover:bg-white/10", "text-text-light/40 hover:text-text-light hover:bg-black/5")}`;

const getHeadingLevel = (editor: NonNullable<ToolbarProps["editor"]>): number => {
  if (editor.isActive("heading", { level: 1 })) {
    return 1;
  }
  if (editor.isActive("heading", { level: 2 })) {
    return 2;
  }
  if (editor.isActive("heading", { level: 3 })) {
    return 3;
  }
  return 0;
};

export const FixedToolbar = ({ editor }: ToolbarProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-0.5 pb-3 mb-3 border-b ${t("border-border-dark", "border-border-light")}`}
    >
      <button
        className={toolbarButton(t, editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
        type="button"
      >
        <TextBolderIcon size={14} weight={editor.isActive("bold") ? "fill" : "regular"} />
      </button>
      <button
        className={toolbarButton(t, editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        type="button"
      >
        <TextItalicIcon size={14} weight={editor.isActive("italic") ? "fill" : "regular"} />
      </button>
      <button
        className={toolbarButton(t, editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
        type="button"
      >
        <TextStrikethroughIcon size={14} weight={editor.isActive("strike") ? "fill" : "regular"} />
      </button>
      <button
        className={toolbarButton(t, editor.isActive("code"))}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline code"
        type="button"
      >
        <CodeIcon size={14} weight={editor.isActive("code") ? "fill" : "regular"} />
      </button>

      <span className="w-1" />

      <select
        className={`bg-transparent text-[11px] lowercase outline-none ${t("text-text-dark/60", "text-text-light/60")}`}
        onChange={(e) => {
          const level = Number.parseInt(e.target.value, 10);
          if (level === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .toggleHeading({ level: level as 1 | 2 | 3 })
              .run();
          }
        }}
        value={getHeadingLevel(editor)}
      >
        <option value={0}>Paragraph</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
      </select>

      <span className="w-1" />

      <button
        className={toolbarButton(t, editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
        type="button"
      >
        <ListBulletsIcon size={14} weight={editor.isActive("bulletList") ? "fill" : "regular"} />
      </button>
      <button
        className={toolbarButton(t, editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered list"
        type="button"
      >
        <ListNumbersIcon size={14} weight={editor.isActive("orderedList") ? "fill" : "regular"} />
      </button>
      <button
        className={toolbarButton(t, editor.isActive("taskList"))}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task list"
        type="button"
      >
        <CheckSquareIcon size={14} weight={editor.isActive("taskList") ? "fill" : "regular"} />
      </button>

      <span className="w-1" />

      <button
        className={toolbarButton(t)}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code block"
        type="button"
      >
        <CodeBlockIcon size={14} />
      </button>
      <button
        className={toolbarButton(t, editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
        type="button"
      >
        <QuotesIcon size={14} weight={editor.isActive("blockquote") ? "fill" : "regular"} />
      </button>
      <button
        className={toolbarButton(t)}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
        type="button"
      >
        <MinusIcon size={14} />
      </button>
      <button
        className={toolbarButton(t)}
        onClick={() =>
          editor.chain().focus().insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run()
        }
        title="Insert table"
        type="button"
      >
        <TableIcon size={14} />
      </button>

      <span className="w-1" />

      <button
        className={toolbarButton(t, editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Align left"
        type="button"
      >
        <TextAlignLeftIcon
          size={14}
          weight={editor.isActive({ textAlign: "left" }) ? "fill" : "regular"}
        />
      </button>
      <button
        className={toolbarButton(t, editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Align center"
        type="button"
      >
        <TextAlignCenterIcon
          size={14}
          weight={editor.isActive({ textAlign: "center" }) ? "fill" : "regular"}
        />
      </button>
      <button
        className={toolbarButton(t, editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Align right"
        type="button"
      >
        <TextAlignRightIcon
          size={14}
          weight={editor.isActive({ textAlign: "right" }) ? "fill" : "regular"}
        />
      </button>
      <button
        className={toolbarButton(t, editor.isActive({ textAlign: "justify" }))}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        title="Justify"
        type="button"
      >
        <TextAlignJustifyIcon
          size={14}
          weight={editor.isActive({ textAlign: "justify" }) ? "fill" : "regular"}
        />
      </button>

      <span className="w-1" />

      <button
        className={toolbarButton(t, editor.isActive("highlight"))}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Highlight"
        type="button"
      >
        <HighlighterIcon size={14} weight={editor.isActive("highlight") ? "fill" : "regular"} />
      </button>

      <span className="flex-1" />

      <button
        className={toolbarButton(t)}
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
        type="button"
      >
        <ArrowCounterClockwiseIcon size={14} />
      </button>
      <button
        className={toolbarButton(t)}
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
        type="button"
      >
        <ArrowClockwiseIcon size={14} />
      </button>
    </div>
  );
};
