import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useAddGroupMember,
  useDeleteGroup,
  useGroupMembers,
  useRemoveGroupMember,
  useUpdateGroup,
} from "@/features/console/hooks/use-groups";
import { useUsers } from "@/features/console/hooks/use-users";
import { useTheme } from "@/shared/hooks/use-theme";
import type { ConsoleUser, Group, GroupMember } from "@/shared/types";

const getInitials = (text: string) =>
  text
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface GroupMemberRowProps {
  disableRemove: boolean;
  isDarkMode: boolean;
  isSelf: boolean;
  member: GroupMember;
  onRemove: (userId: string) => void;
}

const GroupMemberRow = ({
  disableRemove,
  isDarkMode,
  isSelf,
  member,
  onRemove,
}: GroupMemberRowProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div className="flex items-center gap-2">
      {member.avatar_url ? (
        <img
          alt=""
          className="w-5 h-5 rounded-full object-cover shrink-0"
          src={member.avatar_url}
        />
      ) : (
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium shrink-0 bg-white/10 text-text-dark/60">
          {getInitials(member.name || member.email)}
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
      {disableRemove ? (
        <div className="group relative inline-flex">
          <span
            className={`text-[10px] lowercase cursor-not-allowed ${t("text-text-dark/20", "text-text-light/20")}`}
          >
            remove
          </span>
          <span
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-[9px] lowercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${t("bg-neutral-800 text-neutral-200 border-neutral-700", "bg-neutral-200 text-neutral-800 border-neutral-300")}`}
          >
            {isSelf ? "no self actions" : "default group"}
          </span>
        </div>
      ) : (
        <button
          className={`text-[10px] lowercase ${t("text-text-dark/30 hover:text-red-400", "text-text-light/30 hover:text-red-600")}`}
          onClick={() => onRemove(member.user_id)}
          type="button"
        >
          remove
        </button>
      )}
    </div>
  );
};

interface AddMemberDropdownProps {
  allUsers: ConsoleUser[] | undefined;
  groupId: string;
  isDarkMode: boolean;
  memberSearch: string;
  members: GroupMember[];
}

const AddMemberDropdown = ({
  allUsers,
  groupId,
  isDarkMode,
  memberSearch,
  members,
}: AddMemberDropdownProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [isOpen, setIsOpen] = useState(false);
  const addMember = useAddGroupMember();

  const nonMembers = useMemo(() => {
    if (!allUsers) {
      return [];
    }
    const memberIds = new Set(members.map((m) => m.user_id));
    return allUsers.filter((u) => !memberIds.has(u.id));
  }, [allUsers, members]);

  const filteredNonMembers = useMemo(() => {
    if (!memberSearch) {
      return nonMembers;
    }
    const term = memberSearch.toLowerCase();
    return nonMembers.filter(
      (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
    );
  }, [nonMembers, memberSearch]);

  const handleAdd = (userId: string) => {
    addMember.mutate({ groupId, userId });
    setIsOpen(false);
  };

  return (
    <div className="mb-3 relative">
      <button
        className={`text-[10px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80", "text-text-light/50 hover:text-text-light/80")}`}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        + add member
      </button>
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1 border shadow-lg z-10 max-h-40 overflow-y-auto ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
        >
          {filteredNonMembers.length === 0 ? (
            <p
              className={`px-2 py-1.5 text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
            >
              no users to add
            </p>
          ) : (
            filteredNonMembers.map((user) => (
              <button
                key={user.id}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-left text-[11px] ${t("hover:bg-white/5", "hover:bg-black/3")}`}
                onClick={() => handleAdd(user.id)}
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
                    {getInitials(user.name || user.username)}
                  </span>
                )}
                <span className="truncate">{user.name || user.username}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface GroupDetailSidebarProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupDetailSidebar = ({ group, isOpen, onClose }: GroupDetailSidebarProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [memberSearch, setMemberSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: membersData, isPending: membersPending } = useGroupMembers(group.id);
  const { data: currentUser } = useAuth();
  const { data: allUsers } = useUsers();
  const updateGroup = useUpdateGroup();
  const removeMember = useRemoveGroupMember();
  const deleteGroup = useDeleteGroup();

  const members = membersData?.members ?? [];
  const { isDefault } = group;

  const hasChanges =
    name.trim() !== group.name.trim() || description.trim() !== (group.description ?? "").trim();

  const filteredMembers = memberSearch
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : members;

  const handleSave = () => {
    if (!hasChanges || isDefault) {
      return;
    }
    updateGroup.mutate({
      id: group.id,
      input: {
        description: description.trim(),
        name: name.trim(),
      },
    });
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ groupId: group.id, userId });
  };

  const handleDelete = () => {
    if (isDefault) {
      return;
    }
    if (deleteConfirm) {
      deleteGroup.mutate(group.id, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        className="absolute inset-0 appearance-none border-none cursor-default bg-black/20"
        onClick={onClose}
        type="button"
      />

      <div
        className={`relative w-full max-w-sm h-full overflow-y-auto border-l ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark/20">
          <span className={`text-[11px] lowercase ${t("text-text-dark/40", "text-text-light/40")}`}>
            group details
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
          {/* General section */}
          <div className={`border p-3 ${t("border-border-dark", "border-border-light")}`}>
            <span
              className={`block text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
            >
              general
            </span>

            <div className="space-y-2">
              <input
                className={`w-full bg-transparent border-b py-1 text-[11px] outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
                disabled={isDefault}
                onChange={(e) => setName(e.target.value)}
                placeholder="group name"
                type="text"
                value={name}
              />
              <input
                className={`w-full bg-transparent border-b py-1 text-[11px] outline-none transition-colors ${t("border-border-dark text-text-dark placeholder:text-text-dark/20 focus:border-text-dark/50", "border-border-light text-text-light placeholder:text-text-light/20 focus:border-text-light/50")}`}
                disabled={isDefault}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="description"
                type="text"
                value={description}
              />
            </div>

            {isDefault && (
              <p
                className={`mt-2 text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
              >
                default groups cannot be renamed
              </p>
            )}

            <div className="flex items-center justify-end mt-2">
              <button
                className={`text-[10px] lowercase transition-opacity ${hasChanges && !isDefault ? t("text-text-dark/60 hover:text-text-dark/90", "text-text-light/60 hover:text-text-light/90") : "opacity-30 cursor-not-allowed"}`}
                disabled={!hasChanges || isDefault}
                onClick={handleSave}
                type="button"
              >
                save
              </button>
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

            {!isDefault && (
              <AddMemberDropdown
                allUsers={allUsers}
                groupId={group.id}
                isDarkMode={isDarkMode}
                memberSearch={memberSearch}
                members={members}
              />
            )}

            {membersPending ? (
              <p
                className={`text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
              >
                loading members...
              </p>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const isSelf = member.user_id === currentUser?.id;
                  const disableRemove = isDefault || isSelf;
                  return (
                    <GroupMemberRow
                      key={member.user_id}
                      disableRemove={disableRemove}
                      isDarkMode={isDarkMode}
                      isSelf={isSelf}
                      member={member}
                      onRemove={handleRemoveMember}
                    />
                  );
                })}
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

          {/* Danger zone */}
          {!isDefault && (
            <div className={`border p-3 ${t("border-border-dark", "border-border-light")}`}>
              <span
                className={`block text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                danger zone
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[11px] ${t("text-text-dark/80", "text-text-light/80")}`}>
                    delete this group
                  </p>
                  <p className={`text-[10px] ${t("text-text-dark/20", "text-text-light/20")}`}>
                    this action cannot be undone
                  </p>
                </div>
                <button
                  className={`flex items-center gap-1 text-[10px] lowercase ${deleteConfirm ? "text-red-400" : t("text-text-dark/40 hover:text-red-400", "text-text-light/40 hover:text-red-600")}`}
                  onClick={handleDelete}
                  type="button"
                >
                  <TrashIcon size={11} />
                  {deleteConfirm ? "confirm?" : "delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
