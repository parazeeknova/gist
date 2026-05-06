import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, TrashIcon, UsersThreeIcon, XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "#/hooks/use-theme";
import { useAuth } from "#/hooks/use-auth";
import {
  useAddSpaceGroup,
  useAddSpaceMember,
  useDeleteSpace,
  useRemoveSpaceGroup,
  useRemoveSpaceMember,
  useSpaceMembers,
  useUpdateSpace,
  useUpdateSpaceGroupRole,
  useUpdateSpaceMemberRole,
  useUsers,
} from "#/hooks/use-console-mutations";
import { fetchProtected } from "#/hooks/fetch-protected";
import type { ConsoleUser, Group, Space, SpaceMemberMixed } from "#/types";
import { SpaceAvatarUploader } from "./space-avatar-uploader";

const getInitials = (text: string) =>
  text
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const memberRoleLabel = (role: string) => {
  switch (role) {
    case "admin": {
      return "full access";
    }
    case "writer": {
      return "can edit";
    }
    case "reader": {
      return "can view";
    }
    default: {
      return role;
    }
  }
};

const useGroups = (workspaceId: string) =>
  useQuery<{ groups: Group[] }>({
    enabled: workspaceId !== "",
    queryFn: ({ signal }) =>
      fetchProtected<{ groups: Group[] }>(`/api/console/workspaces/${workspaceId}/groups`, {
        signal,
      }),
    queryKey: ["groups", workspaceId],
  });

interface GroupSelectDropdownProps {
  availableGroups: Group[];
  isDarkMode: boolean;
  selectedGroupId: string;
  onSelect: (groupId: string) => void;
}

interface MemberListItemProps {
  member: SpaceMemberMixed;
  currentUserId?: string;
  spaceCreatorId?: string;
  isDarkMode: boolean;
  updatingMember: string | null;
  onUpdateGroupRole: (groupId: string, role: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onUpdateMemberRole: (userId: string, role: string) => void;
  onRemoveMember: (userId: string) => void;
}

const MemberListItem = ({
  member,
  currentUserId,
  spaceCreatorId,
  isDarkMode,
  updatingMember,
  onUpdateGroupRole,
  onRemoveGroup,
  onUpdateMemberRole,
  onRemoveMember,
}: MemberListItemProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (member.memberType === "group") {
    return (
      <div key={member.groupId} className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white/10">
          <UsersThreeIcon className={t("text-text-dark/60", "text-text-light/60")} size={10} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] truncate">{member.name}</p>
          {member.description && (
            <p className={`text-[10px] truncate ${t("text-text-dark/30", "text-text-light/30")}`}>
              {member.description}
            </p>
          )}
        </div>
        <select
          className={`text-[10px] bg-transparent outline-none cursor-pointer ${t("text-text-dark/50", "text-text-light/50")} ${updatingMember === member.groupId ? "opacity-50" : ""}`}
          disabled={updatingMember === member.groupId}
          onChange={(e) => onUpdateGroupRole(member.groupId ?? "", e.target.value)}
          value={member.role}
        >
          <option value="admin">full access</option>
          <option value="writer">can edit</option>
          <option value="reader">can view</option>
        </select>
        <button
          className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-red-400", "text-text-light/30 hover:text-red-600")}`}
          onClick={() => onRemoveGroup(member.groupId ?? "")}
          type="button"
        >
          remove
        </button>
      </div>
    );
  }

  const isSelf = member.userId === currentUserId;
  const isCreator = member.userId === spaceCreatorId;
  const disableControls = isSelf || isCreator;
  return (
    <div key={member.userId} className="flex items-center gap-2">
      {member.avatarUrl ? (
        <img alt="" className="w-5 h-5 rounded-full object-cover shrink-0" src={member.avatarUrl} />
      ) : (
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium shrink-0 bg-white/10 text-text-dark/60">
          {getInitials(member.name || (member.email ?? ""))}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] truncate">{member.name || member.email}</p>
        {member.name && (
          <p className={`text-[10px] truncate ${t("text-text-dark/30", "text-text-light/30")}`}>
            {member.email}
          </p>
        )}
      </div>
      {disableControls ? (
        <div className="group relative inline-flex">
          <span
            className={`text-[10px] lowercase cursor-not-allowed ${t("text-text-dark/20", "text-text-light/20")}`}
          >
            {isCreator ? "full access" : memberRoleLabel(member.role)}
          </span>
          <span
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-[9px] lowercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${t("bg-neutral-800 text-neutral-200 border-neutral-700", "bg-neutral-200 text-neutral-800 border-neutral-300")}`}
          >
            {isCreator ? "space creator" : "no self actions"}
          </span>
        </div>
      ) : (
        <select
          className={`text-[10px] bg-transparent outline-none cursor-pointer ${t("text-text-dark/50", "text-text-light/50")} ${updatingMember === member.userId ? "opacity-50" : ""}`}
          disabled={updatingMember === member.userId}
          onChange={(e) => onUpdateMemberRole(member.userId ?? "", e.target.value)}
          value={member.role}
        >
          <option value="admin">full access</option>
          <option value="writer">can edit</option>
          <option value="reader">can view</option>
        </select>
      )}
      {disableControls ? (
        <div className="group relative inline-flex">
          <span
            className={`text-[10px] lowercase cursor-not-allowed ${t("text-text-dark/20", "text-text-light/20")}`}
          >
            remove
          </span>
          <span
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-[9px] lowercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${t("bg-neutral-800 text-neutral-200 border-neutral-700", "bg-neutral-200 text-neutral-800 border-neutral-300")}`}
          >
            {isCreator ? "space creator" : "no self actions"}
          </span>
        </div>
      ) : (
        <button
          className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-red-400", "text-text-light/30 hover:text-red-600")}`}
          onClick={() => onRemoveMember(member.userId ?? "")}
          type="button"
        >
          remove
        </button>
      )}
    </div>
  );
};

const GroupSelectDropdown = ({
  availableGroups,
  isDarkMode,
  selectedGroupId,
  onSelect,
}: GroupSelectDropdownProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const selectedGroup = availableGroups.find((g) => g.id === selectedGroupId);

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        className={`w-full text-left bg-transparent py-1 text-[10px] lowercase outline-none border-b ${t("border-border-dark text-text-dark/60", "border-border-light text-text-light/60")}`}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        {selectedGroup ? selectedGroup.name : "add group..."}
      </button>
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1 border shadow-lg z-10 max-h-40 overflow-y-auto ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
        >
          {availableGroups.length === 0 ? (
            <p
              className={`px-2 py-1.5 text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
            >
              no groups to add
            </p>
          ) : (
            availableGroups.map((g) => (
              <button
                key={g.id}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-left text-[11px] ${t("hover:bg-white/5", "hover:bg-black/3")}`}
                onClick={() => {
                  onSelect(g.id);
                  setIsOpen(false);
                }}
                type="button"
              >
                <UsersThreeIcon
                  className={t("text-text-dark/40", "text-text-light/40")}
                  size={12}
                />
                <span className="truncate">{g.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface UserSelectDropdownProps {
  availableUsers: ConsoleUser[];
  isDarkMode: boolean;
  selectedUserId: string;
  onSelect: (userId: string) => void;
}

const UserSelectDropdown = ({
  availableUsers,
  isDarkMode,
  selectedUserId,
  onSelect,
}: UserSelectDropdownProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const selectedUser = availableUsers.find((u) => u.id === selectedUserId);

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        className={`w-full text-left bg-transparent py-1 text-[10px] lowercase outline-none border-b ${t("border-border-dark text-text-dark/60", "border-border-light text-text-light/60")}`}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        {selectedUser ? selectedUser.name || selectedUser.email : "add member..."}
      </button>
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1 border shadow-lg z-10 max-h-40 overflow-y-auto ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
        >
          {availableUsers.length === 0 ? (
            <p
              className={`px-2 py-1.5 text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
            >
              no users to add
            </p>
          ) : (
            availableUsers.map((user) => (
              <button
                key={user.id}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-left text-[11px] ${t("hover:bg-white/5", "hover:bg-black/3")}`}
                onClick={() => {
                  onSelect(user.id);
                  setIsOpen(false);
                }}
                type="button"
              >
                {user.avatar_url ? (
                  <img
                    alt=""
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                    src={user.avatar_url}
                  />
                ) : (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-medium shrink-0 bg-white/10 text-text-dark/60">
                    {getInitials(user.name || user.email)}
                  </span>
                )}
                <span className="truncate">{user.name || user.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface RoleSelectDropdownProps {
  isDarkMode: boolean;
  role: string;
  onChange: (role: string) => void;
}

const RoleSelectDropdown = ({ isDarkMode, role, onChange }: RoleSelectDropdownProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const roles = [
    { label: "can edit", value: "writer" },
    { label: "full access", value: "admin" },
    { label: "can view", value: "reader" },
  ];

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const selectedRole = roles.find((r) => r.value === role);

  return (
    <div ref={containerRef} className="relative w-24 shrink-0">
      <button
        className={`w-full text-left bg-transparent py-1 text-[10px] lowercase outline-none border-b ${t("border-border-dark text-text-dark/60", "border-border-light text-text-light/60")}`}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        {selectedRole ? selectedRole.label : "role..."}
      </button>
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1 border shadow-lg z-10 ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
        >
          {roles.map((r) => (
            <button
              key={r.value}
              className={`w-full text-left px-2 py-1.5 text-[10px] lowercase ${t("hover:bg-white/5", "hover:bg-black/3")} ${role === r.value ? t("text-text-dark/80", "text-text-light/80") : t("text-text-dark/40", "text-text-light/40")}`}
              onClick={() => {
                onChange(r.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface SpaceDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  workspaceName: string;
}

export const SpaceDetailSidebar = ({
  isOpen,
  onClose,
  space,
  workspaceName,
}: SpaceDetailSidebarProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const [name, setName] = useState(space.name);
  const [slug, setSlug] = useState(space.slug);
  const [description, setDescription] = useState(space.description ?? "");
  const [icon, setIcon] = useState(space.icon ?? "");
  const [memberSearch, setMemberSearch] = useState("");
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [addGroupRole, setAddGroupRole] = useState("writer");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("writer");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const hasChanges =
    name.trim() !== space.name.trim() ||
    slug.trim() !== space.slug.trim() ||
    description.trim() !== (space.description ?? "").trim() ||
    icon.trim() !== (space.icon ?? "").trim();

  const { data: members, isPending: membersPending } = useSpaceMembers(space.id);
  const { data: currentUser } = useAuth();
  const { data: groupsData } = useGroups(space.workspaceId);
  const updateSpace = useUpdateSpace();
  const updateRole = useUpdateSpaceMemberRole();
  const removeMember = useRemoveSpaceMember();
  const addSpaceGroup = useAddSpaceGroup();
  const addSpaceMember = useAddSpaceMember();
  const updateGroupRole = useUpdateSpaceGroupRole();
  const removeGroup = useRemoveSpaceGroup();
  const deleteSpace = useDeleteSpace();
  const { data: allUsers } = useUsers();

  const filteredMembers = useMemo(() => {
    if (!memberSearch || !members) {
      return members ?? [];
    }
    const term = memberSearch.toLowerCase();
    return members.filter((m) => {
      if (m.memberType === "user") {
        return m.name.toLowerCase().includes(term) || (m.email?.toLowerCase() ?? "").includes(term);
      }
      return (
        m.name.toLowerCase().includes(term) || (m.description?.toLowerCase() ?? "").includes(term)
      );
    });
  }, [members, memberSearch]);

  const availableGroups = useMemo(() => {
    const all = groupsData?.groups ?? [];
    const existingGroupIds = new Set(
      (members ?? []).filter((m) => m.memberType === "group").map((m) => m.groupId),
    );
    return all.filter((g) => !existingGroupIds.has(g.id));
  }, [groupsData, members]);

  const availableUsers = useMemo(() => {
    if (!allUsers) {
      return [];
    }
    const directMemberIds = new Set(
      (members ?? []).filter((m) => m.memberType === "user").map((m) => m.userId),
    );
    return allUsers.filter((u) => !directMemberIds.has(u.id));
  }, [allUsers, members]);

  const handleSaveDetails = () => {
    updateSpace.mutate({
      id: space.id,
      input: {
        description: description.trim(),
        icon: icon.trim(),
        name: name.trim(),
        slug: slug.trim(),
      },
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUpdatingMember(userId);
    updateRole.mutate(
      { role: newRole, spaceId: space.id, userId },
      {
        onSettled: () => setUpdatingMember(null),
      },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ spaceId: space.id, userId });
  };

  const handleGroupRoleChange = (groupId: string, newRole: string) => {
    setUpdatingMember(groupId);
    updateGroupRole.mutate(
      { groupId, role: newRole, spaceId: space.id },
      {
        onSettled: () => setUpdatingMember(null),
      },
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    removeGroup.mutate({ groupId, spaceId: space.id });
  };

  const handleAddGroup = () => {
    if (!selectedGroupId) {
      return;
    }
    addSpaceGroup.mutate(
      { groupId: selectedGroupId, role: addGroupRole, spaceId: space.id },
      {
        onSuccess: () => {
          setSelectedGroupId("");
          setAddGroupRole("writer");
        },
      },
    );
  };

  const handleAddMember = () => {
    if (!selectedUserId) {
      return;
    }
    addSpaceMember.mutate(
      { role: addMemberRole, spaceId: space.id, userId: selectedUserId },
      {
        onSuccess: () => {
          setSelectedUserId("");
          setAddMemberRole("writer");
        },
      },
    );
  };

  const handleDeleteSpace = () => {
    if (deleteConfirm) {
      deleteSpace.mutate(space.id, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const SecuritySection = () => (
    <div className={`border p-3 ${t("border-border-dark", "border-border-light")} opacity-50`}>
      <span
        className={`block text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
      >
        security
      </span>

      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-[11px]">disable public sharing</span>
          <span className={`text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
            prevent anyone from sharing this space publicly
          </span>
        </div>
        <div
          className={`w-8 h-4 rounded-full relative ${t("bg-border-dark", "bg-border-light")}`}
          title="coming soon"
        >
          <div className="w-3 h-3 rounded-full bg-white/20 absolute left-0.5 top-0.5" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px]">allow viewers to comment</span>
          <span className={`text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
            let viewers with can view access leave comments
          </span>
        </div>
        <div
          className={`w-8 h-4 rounded-full relative ${t("bg-border-dark", "bg-border-light")}`}
          title="coming soon"
        >
          <div className="w-3 h-3 rounded-full bg-white/20 absolute left-0.5 top-0.5" />
        </div>
      </div>
    </div>
  );

  const DangerZone = () => (
    <div className={`border p-3 ${t("border-border-dark", "border-border-light")}`}>
      <span
        className={`block text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
      >
        danger zone
      </span>

      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[11px] ${t("text-text-dark/80", "text-text-light/80")}`}>
            delete this space
          </p>
          <p className={`text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
            this action cannot be undone
          </p>
        </div>
        <button
          className={`flex items-center gap-1 text-[10px] lowercase ${deleteConfirm ? "text-red-400" : t("text-text-dark/40 hover:text-red-400", "text-text-light/40 hover:text-red-600")}`}
          onClick={handleDeleteSpace}
          type="button"
        >
          <TrashIcon size={11} />
          {deleteConfirm ? "confirm?" : "delete"}
        </button>
      </div>
    </div>
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/20 appearance-none border-none cursor-default"
        onClick={onClose}
        type="button"
      />

      {/* Sidebar panel */}
      <div
        className={`relative w-full max-w-sm h-full overflow-y-auto border-l ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark/20">
          <span className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}>
            space details
          </span>
          <button
            className={`${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
            onClick={onClose}
            type="button"
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Space info section */}
          <div className={`border p-3 ${t("border-border-dark", "border-border-light")}`}>
            <span
              className={`block text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
            >
              general
            </span>

            <div className="flex flex-col items-center mb-4">
              <SpaceAvatarUploader
                avatarUrl={icon}
                description={description}
                name={name}
                onAvatarChange={setIcon}
                slug={slug}
                spaceId={space.id}
              />
            </div>

            <div className="space-y-2">
              <input
                className={`w-full bg-transparent border-b py-1 text-[11px] outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
                onChange={(e) => setName(e.target.value)}
                placeholder="name"
                type="text"
                value={name}
              />
              <input
                className={`w-full bg-transparent border-b py-1 text-[11px] outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug"
                type="text"
                value={slug}
              />
              <input
                className={`w-full bg-transparent border-b py-1 text-[11px] outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="description"
                type="text"
                value={description}
              />
            </div>

            <div className="flex items-center justify-end mt-2">
              <button
                className={`text-[10px] lowercase transition-opacity ${hasChanges ? t("text-text-dark/60 hover:text-text-dark/90", "text-text-light/60 hover:text-text-light/90") : "opacity-30 cursor-not-allowed"}`}
                disabled={!hasChanges}
                onClick={handleSaveDetails}
                type="button"
              >
                save
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span
                className={`text-[10px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                workspace:
              </span>
              <span className="text-[11px]">{workspaceName}</span>
            </div>
          </div>

          {/* Members section */}
          <div className={`border p-3 ${t("border-border-dark", "border-border-light")}`}>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                members
              </span>
              <span
                className={`text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
              >
                {filteredMembers.length} member{filteredMembers.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <MagnifyingGlassIcon
                className={t("text-text-dark/20", "text-text-light/20")}
                size={11}
              />
              <input
                className={`flex-1 bg-transparent py-1 text-[11px] lowercase outline-none border-b ${t("border-border-dark placeholder:text-text-dark/20 text-text-dark/60", "border-border-light placeholder:text-text-light/20 text-text-light/60")}`}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="search members"
                type="text"
                value={memberSearch}
              />
            </div>

            {availableUsers.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <UserSelectDropdown
                  availableUsers={availableUsers}
                  isDarkMode={isDarkMode}
                  selectedUserId={selectedUserId}
                  onSelect={setSelectedUserId}
                />
                <RoleSelectDropdown
                  isDarkMode={isDarkMode}
                  role={addMemberRole}
                  onChange={setAddMemberRole}
                />
                <button
                  className={`text-[10px] lowercase ${selectedUserId ? t("text-text-dark/60 hover:text-text-dark/90", "text-text-light/60 hover:text-text-light/90") : "opacity-30 cursor-not-allowed"}`}
                  disabled={!selectedUserId || addSpaceMember.isPending}
                  onClick={handleAddMember}
                  type="button"
                >
                  add
                </button>
              </div>
            )}

            {availableGroups.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <GroupSelectDropdown
                  availableGroups={availableGroups}
                  isDarkMode={isDarkMode}
                  selectedGroupId={selectedGroupId}
                  onSelect={setSelectedGroupId}
                />
                <RoleSelectDropdown
                  isDarkMode={isDarkMode}
                  role={addGroupRole}
                  onChange={setAddGroupRole}
                />
                <button
                  className={`text-[10px] lowercase ${selectedGroupId ? t("text-text-dark/60 hover:text-text-dark/90", "text-text-light/60 hover:text-text-light/90") : "opacity-30 cursor-not-allowed"}`}
                  disabled={!selectedGroupId || addSpaceGroup.isPending}
                  onClick={handleAddGroup}
                  type="button"
                >
                  add
                </button>
              </div>
            )}

            {membersPending ? (
              <p
                className={`text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
              >
                loading members...
              </p>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member: SpaceMemberMixed) => (
                  <MemberListItem
                    key={member.memberType === "group" ? member.groupId : member.userId}
                    currentUserId={currentUser?.id}
                    isDarkMode={isDarkMode}
                    member={member}
                    spaceCreatorId={space.createdBy}
                    updatingMember={updatingMember}
                    onRemoveGroup={handleRemoveGroup}
                    onRemoveMember={handleRemoveMember}
                    onUpdateGroupRole={handleGroupRoleChange}
                    onUpdateMemberRole={handleRoleChange}
                  />
                ))}
                {filteredMembers.length === 0 && memberSearch && (
                  <p
                    className={`text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
                  >
                    no members match your search
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Security section */}
          <SecuritySection />

          {/* Danger zone */}
          <DangerZone />
        </div>
      </div>
    </div>
  );
};
