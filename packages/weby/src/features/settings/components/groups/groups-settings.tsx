import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useConsoleContext } from "#/features/console/components/console-context";
import { useCreateGroup } from "#/features/console/hooks/use-groups";
import { fetchProtected } from "#/features/auth/hooks/fetch-protected";
import { useTheme } from "#/shared/hooks/use-theme";
import type { Group } from "#/shared/types";
import { GroupDetailSidebar } from "./group-detail-sidebar";

const useGroups = () => {
  const { selectedWorkspaceId } = useConsoleContext();
  return useQuery<{ groups: Group[] }>({
    enabled: !!selectedWorkspaceId,
    queryFn: ({ signal }) =>
      fetchProtected<{ groups: Group[] }>(`/api/console/workspaces/${selectedWorkspaceId}/groups`, {
        signal,
      }),
    queryKey: ["groups", selectedWorkspaceId],
  });
};

interface CreateGroupDropdownProps {
  isDarkMode: boolean;
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
}

const CreateGroupDropdown = ({
  isDarkMode,
  isOpen,
  workspaceId,
  onClose,
}: CreateGroupDropdownProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    setError("");
    if (!name.trim()) {
      setError("name is required");
      return;
    }
    createGroup.mutate(
      {
        input: {
          description: description.trim(),
          name: name.trim(),
        },
        workspaceId,
      },
      {
        onError: (err: Error) => {
          setError(err.message || "failed to create group");
        },
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full mt-1 w-64 border p-3 shadow-xl z-50 ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
    >
      {error && (
        <p className={`mb-2 text-[10px] lowercase ${t("text-red-400", "text-red-600")}`}>{error}</p>
      )}

      <div className="space-y-2">
        <input
          className={`w-full bg-transparent border-b py-1.5 text-[11px] lowercase outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
          onChange={(e) => setName(e.target.value)}
          placeholder="group name"
          type="text"
          value={name}
        />
        <input
          className={`w-full bg-transparent border-b py-1.5 text-[11px] lowercase outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="description"
          type="text"
          value={description}
        />
      </div>

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          className={`text-[10px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
          onClick={onClose}
          type="button"
        >
          cancel
        </button>
        <button
          className={`text-[10px] lowercase ${t("text-text-dark/60 hover:text-text-dark/90", "text-text-light/60 hover:text-text-light/90")}`}
          onClick={handleSubmit}
          type="button"
        >
          create
        </button>
      </div>
    </div>
  );
};

interface GroupListItemProps {
  group: Group;
  isDarkMode: boolean;
  isLast: boolean;
  onClick: () => void;
}

const GroupListItem = ({ group, isDarkMode, isLast, onClick }: GroupListItemProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <button
      className={`flex w-full items-center justify-between py-3 px-3 text-left cursor-pointer ${t("hover:bg-white/2", "hover:bg-black/2")} ${isLast ? "" : t("border-b border-border-dark/10", "border-b border-border-light/10")}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`shrink-0 size-8 rounded flex items-center justify-center ${t("bg-white/5", "bg-black/3")}`}
        >
          <UsersThreeIcon className={`size-4 ${t("text-text-dark/40", "text-text-light/40")}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] lowercase truncate ${t("text-text-dark/90", "text-text-light/90")}`}
            >
              {group.name}
            </span>
            {group.isDefault && (
              <span
                className={`shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${t("text-text-dark/40 border-border-dark", "text-text-light/40 border-border-light")}`}
              >
                default
              </span>
            )}
          </div>
          {group.description && (
            <p
              className={`text-[10px] lowercase truncate ${t("text-text-dark/30", "text-text-light/30")}`}
            >
              {group.description}
            </p>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 text-[10px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
      >
        {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
      </span>
    </button>
  );
};

export const GroupsSettings = () => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const { selectedWorkspaceId } = useConsoleContext();
  const { data, isPending } = useGroups();
  const groups = data?.groups ?? [];
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  let content: React.ReactNode;
  if (isPending) {
    content = (
      <div className="py-8 text-center px-3">
        <p className={`text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}>
          loading groups...
        </p>
      </div>
    );
  } else if (groups.length === 0) {
    content = (
      <div className="py-8 text-center px-3">
        <UsersThreeIcon
          className={`mx-auto mb-2 size-6 ${t("text-text-dark/20", "text-text-light/20")}`}
        />
        <p className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}>
          no groups found
        </p>
        <p className={`text-[10px] lowercase mt-1 ${t("text-text-dark/20", "text-text-light/20")}`}>
          every workspace has a default "everyone" group that includes all members
        </p>
      </div>
    );
  } else {
    content = (
      <div>
        {groups.map((group, index) => (
          <GroupListItem
            key={group.id}
            group={group}
            isDarkMode={isDarkMode}
            isLast={index === groups.length - 1}
            onClick={() => setSelectedGroup(group)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        groups
      </h1>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p
            className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            workspace groups
          </p>
          <div className="relative">
            <button
              className={`flex items-center gap-1 text-[10px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
              onClick={() => setShowCreate((v) => !v)}
              type="button"
            >
              <PlusIcon size={11} />
              create group
            </button>
            <CreateGroupDropdown
              isDarkMode={isDarkMode}
              isOpen={showCreate}
              workspaceId={selectedWorkspaceId ?? ""}
              onClose={() => setShowCreate(false)}
            />
          </div>
        </div>

        <div className={`border ${t("border-border-dark", "border-border-light")}`}>{content}</div>
      </div>

      {selectedGroup && (
        <GroupDetailSidebar
          group={selectedGroup}
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};
