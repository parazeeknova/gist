import { CheckIcon } from "@phosphor-icons/react";
import { useState, useCallback } from "react";
import { useTheme } from "#/hooks/use-theme";
import { useUpdateWorkspace } from "#/hooks/use-workspace-settings";

interface WorkspaceSlugEditorProps {
  name: string;
  workspaceId: string;
  slug: string;
  icon: string;
  hasChanges: boolean;
  onSlugChange: (slug: string) => void;
}

export const WorkspaceSlugEditor = ({
  name,
  workspaceId,
  slug,
  icon,
  hasChanges,
  onSlugChange,
}: WorkspaceSlugEditorProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const updateWorkspace = useUpdateWorkspace();

  const handleSave = useCallback(() => {
    if (!slug.trim()) {
      return;
    }
    updateWorkspace.mutate(
      { id: workspaceId, input: { icon, name: name.trim(), slug: slug.trim() } },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        },
      },
    );
  }, [icon, name, slug, workspaceId, updateWorkspace]);

  const saveButtonClass = () => {
    if (saveSuccess) {
      return t("text-green-400", "text-green-600");
    }
    if (hasChanges) {
      return t(
        "text-text-dark/50 hover:text-text-dark/80",
        "text-text-light/50 hover:text-text-light/80",
      );
    }
    return t("text-text-dark/20 cursor-not-allowed", "text-text-light/20 cursor-not-allowed");
  };

  return (
    <div className="py-3">
      <label
        className={`block text-[10px] uppercase tracking-wider mb-2 ${t("text-text-dark/30", "text-text-light/30")}`}
        htmlFor="workspace-slug"
      >
        slug
      </label>
      <div className="flex items-end gap-3">
        <input
          className={`flex-1 bg-transparent border-b py-2 text-[13px] lowercase outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
          id="workspace-slug"
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="workspace-slug"
          type="text"
          value={slug}
        />
        <button
          className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] lowercase transition-colors ${saveButtonClass()}`}
          disabled={!hasChanges}
          onClick={handleSave}
          type="button"
        >
          {saveSuccess ? <CheckIcon size={12} /> : null}
          {saveSuccess ? "saved" : "save"}
        </button>
      </div>
    </div>
  );
};
