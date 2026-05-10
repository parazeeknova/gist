import type { Editor } from "@tiptap/react";

export interface PageEditorProps {
  pageId: string;
  contentJson: string;
  editable: boolean;
}

export interface ToolbarProps {
  editor: Editor;
}
