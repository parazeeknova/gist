import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useTheme } from "#/hooks/use-theme";
import { useAuth } from "#/hooks/use-auth";
import {
  useRemoveSpaceMember,
  useSpaceMembers,
  useUpdateSpace,
  useUpdateSpaceMemberRole,
} from "#/hooks/use-console-mutations";
import type { Space, SpaceMemberWithUser } from "#/types";
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

  const hasChanges =
    name.trim() !== space.name.trim() ||
    slug.trim() !== space.slug.trim() ||
    description.trim() !== (space.description ?? "").trim() ||
    icon.trim() !== (space.icon ?? "").trim();

  const { data: members, isPending: membersPending } = useSpaceMembers(space.id);
  const { data: currentUser } = useAuth();
  const updateSpace = useUpdateSpace();
  const updateRole = useUpdateSpaceMemberRole();
  const removeMember = useRemoveSpaceMember();

  const filteredMembers = useMemo(() => {
    if (!memberSearch || !members) {
      return members ?? [];
    }
    const term = memberSearch.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term),
    );
  }, [members, memberSearch]);

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

  const handleRoleChange = (member: SpaceMemberWithUser, newRole: string) => {
    setUpdatingMember(member.user_id);
    updateRole.mutate(
      { role: newRole, spaceId: space.id, userId: member.user_id },
      {
        onSettled: () => setUpdatingMember(null),
      },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ spaceId: space.id, userId });
  };

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
                  const isCreator = member.user_id === space.createdBy;
                  const disableControls = isSelf || isCreator;
                  return (
                    <div key={member.user_id} className="flex items-center gap-2">
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
                          <p
                            className={`text-[10px] truncate ${t("text-text-dark/30", "text-text-light/30")}`}
                          >
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
                          className={`text-[10px] bg-transparent outline-none cursor-pointer ${t("text-text-dark/50", "text-text-light/50")} ${updatingMember === member.user_id ? "opacity-50" : ""}`}
                          disabled={updatingMember === member.user_id}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
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
                          onClick={() => handleRemoveMember(member.user_id)}
                          type="button"
                        >
                          remove
                        </button>
                      )}
                    </div>
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

          {/* Security section */}
          <div
            className={`border p-3 ${t("border-border-dark", "border-border-light")} opacity-50`}
          >
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
        </div>
      </div>
    </div>
  );
};
