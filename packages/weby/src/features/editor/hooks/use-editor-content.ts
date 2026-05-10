import { useRef, useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useUpdatePage } from "#/features/console/hooks/use-pages";

export const useEditorContent = (editor: Editor | null, pageId: string) => {
  const updatePage = useUpdatePage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirty, setDirty] = useState(false);

  const flush = useCallback(() => {
    if (!editor) {
      return;
    }
    const json = editor.getJSON();
    const text = editor.getText();
    updatePage.mutate(
      {
        id: pageId,
        input: {
          contentJson: JSON.stringify(json),
          textContent: text,
        },
      },
      {
        onSuccess: () => setDirty(false),
      },
    );
  }, [editor, pageId, updatePage]);

  const markDirty = useCallback(() => {
    setDirty(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      flush();
    }, 1500);
  }, [flush]);

  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  return { cleanup, dirty, flush, isSaving: updatePage.isPending, markDirty };
};
