import type { Editor } from "@tiptap/react";

export interface PageEditorProps {
  pageId: string;
  contentJson: string;
  editable: boolean;
  title: string;
  spaceName?: string;
  spaceSlug?: string;
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  textContent?: string;
  onDeleteStart?: () => void;
}

export interface ToolbarProps {
  editor: Editor | null;
}
