import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { useConsoleContext } from "@/features/console/components/console-context";
import { useWorkspaces } from "@/features/console/hooks/use-workspaces";
import { WorkspaceAvatarUploader } from "./workspace-avatar-uploader";
import { WorkspaceNameEditor } from "./workspace-name-editor";
import { WorkspaceSlugEditor } from "./workspace-slug-editor";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/[\s_-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

interface WorkspaceSettingsProps {
  urlWorkspaceName?: string;
}

export const WorkspaceSettings = ({ urlWorkspaceName }: WorkspaceSettingsProps) => {
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useConsoleContext();
  const { data: workspaces } = useWorkspaces();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate({ from: "/settings/workspace" });
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  // Read workspace name from URL on mount / when workspaces load
  useEffect(() => {
    if (urlWorkspaceName && workspaces) {
      const matched = workspaces.find(
        (w) => w.name === urlWorkspaceName || w.slug === urlWorkspaceName,
      );
      if (matched && matched.id !== selectedWorkspaceId) {
        setSelectedWorkspaceId(matched.id);
      }
    }
  }, [urlWorkspaceName, workspaces, selectedWorkspaceId, setSelectedWorkspaceId]);

  // Auto-select first workspace if none is selected
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces && workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId, setSelectedWorkspaceId]);

  const workspace = workspaces?.find((w) => w.id === selectedWorkspaceId);

  const [name, setName] = useState(workspace?.name ?? "");
  const [slug, setSlug] = useState(workspace?.slug ?? "");
  const [avatarUrl, setAvatarUrl] = useState(workspace?.icon ?? "");

  // Sync local state when workspace changes (by ID only)
  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setSlug(workspace.slug);
      setAvatarUrl(workspace.icon);
    }
  }, [workspace, workspace?.id]);

  // Auto-slugify name into slug when slug hasn't been manually edited
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  useEffect(() => {
    if (name.trim() && !userEditedSlug) {
      setSlug(slugify(name));
    }
  }, [name, userEditedSlug]);

  // Reset userEditedSlug when switching workspaces
  useEffect(() => {
    setUserEditedSlug(false);
  }, [workspace?.id]);

  // Update URL and document title when workspace changes
  useEffect(() => {
    if (workspace) {
      document.title = `verso — ${workspace.name}`;
      navigate({ replace: true, search: { name: workspace.name } });
    } else {
      document.title = "verso — workspace";
    }
    return () => {
      document.title = "verso — console";
    };
  }, [workspace, workspace?.name, navigate]);

  const hasNameChanges = workspace ? name.trim() !== workspace.name.trim() : false;
  const hasSlugChanges = workspace ? slug.trim() !== workspace.slug.trim() : false;

  if (!workspace) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1
          className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
        >
          workspace settings
        </h1>
        <p
          className={`text-center text-[13px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}
        >
          select a workspace to edit
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        workspace settings
      </h1>

      <div className="mb-8">
        <p
          className={`text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          general
        </p>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          <div className="flex items-center gap-6 py-3">
            <WorkspaceAvatarUploader
              avatarUrl={avatarUrl}
              name={name}
              onAvatarChange={setAvatarUrl}
              slug={slug}
              workspaceId={workspace.id}
            />
            <div className="flex-1 min-w-0">
              <WorkspaceNameEditor
                hasChanges={hasNameChanges}
                icon={avatarUrl}
                name={name}
                onNameChange={setName}
                slug={slug}
                workspaceId={workspace.id}
              />
              <WorkspaceSlugEditor
                hasChanges={hasSlugChanges}
                icon={avatarUrl}
                name={name}
                onSlugChange={(newSlug: string) => {
                  setSlug(newSlug);
                  setUserEditedSlug(true);
                }}
                slug={slug}
                workspaceId={workspace.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
