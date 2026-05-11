import {
  BookmarkSimpleIcon,
  CameraIcon,
  ClockCounterClockwiseIcon,
  DotsThreeVerticalIcon,
  ImageIcon,
  ListBulletsIcon,
  PencilSimpleIcon,
  SquaresFourIcon,
  StarIcon,
  TextAlignLeftIcon,
  TrashIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import {
  useIsSpaceFavorited,
  useSpaceBySlug,
  useSpaceMembers,
  useToggleSpaceFavorite,
  useUpdateSpace,
} from "#/features/console/hooks/use-spaces";
import { useAuth } from "#/features/auth/hooks/use-auth";
import { usePageTree } from "#/features/console/hooks/use-pages";
import {
  useFavoritedPages,
  useTogglePageFavorite,
} from "#/features/console/hooks/use-page-favorites";
import { AvatarBadge } from "#/shared/components/avatar-badge";
import { SidebarTooltip } from "#/features/console/components/sidebar-tooltip";
import { compressImage } from "#/shared/lib/image-compress";
import { UnsplashPicker } from "./unsplash-picker";
import type { PageTreeItem, SpaceMemberMixed } from "#/shared/types";

type Tab = "recents" | "favorites" | "mine";
type ViewMode = "list" | "grid";

const groupByDate = (
  items: PageTreeItem[],
  sortBy: "createdAt" | "updatedAt",
): [string, PageTreeItem[]][] => {
  const groups = new Map<string, PageTreeItem[]>();
  for (const item of items) {
    const dateKey = (sortBy === "updatedAt" ? item.updatedAt : item.createdAt).slice(0, 10);
    const group = groups.get(dateKey);
    if (group) {
      group.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }
  return [...groups.entries()].toSorted(([a], [b]) => b.localeCompare(a));
};

const formatDateHeading = (dateStr: string): string => {
  const date = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  }
  if (diffDays === 1) {
    return "yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

interface SpaceContentSectionProps {
  activeTab: Tab;
  favorites: string[];
  groupedPages: [string, PageTreeItem[]][];
  isDarkMode: boolean;
  isPending: boolean;
  treeItems: PageTreeItem[] | undefined;
  viewMode: ViewMode;
  onNavigate: (pageSlug: string) => void;
  onSetActiveTab: (tab: Tab) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleFavorite: (pageId: string) => void;
}

const SpaceContentSection = ({
  activeTab,
  favorites,
  groupedPages,
  isDarkMode,
  isPending,
  treeItems,
  viewMode,
  onNavigate,
  onSetActiveTab,
  onSetViewMode,
  onToggleFavorite,
}: SpaceContentSectionProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div className={`mt-6 border-t pt-5 ${t("border-border-dark", "border-border-light")}`}>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(
            [
              ["recents", ClockCounterClockwiseIcon] as const,
              ["favorites", BookmarkSimpleIcon] as const,
              ["mine", UserIcon] as const,
            ] as const
          ).map(([tab, Icon]) => (
            <button
              className={`flex items-center gap-1.5 px-2 py-1 text-[11px] lowercase border ${
                activeTab === tab
                  ? t(
                      "text-text-dark border-border-dark bg-white/5",
                      "text-text-light border-border-light bg-black/5",
                    )
                  : t(
                      "text-text-dark/40 border-border-dark hover:text-text-dark/70 hover:bg-white/3",
                      "text-text-light/40 border-border-light hover:text-text-light/70 hover:bg-black/3",
                    )
              }`}
              key={tab}
              onClick={() => onSetActiveTab(tab)}
              type="button"
            >
              <Icon size={11} />
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            className={`flex items-center gap-1 px-1.5 py-1 text-[11px] lowercase border ${
              viewMode === "list"
                ? t(
                    "text-text-dark border-border-dark bg-white/5",
                    "text-text-light border-border-light bg-black/5",
                  )
                : t(
                    "text-text-dark/40 border-border-dark hover:text-text-dark/70",
                    "text-text-light/40 border-border-light hover:text-text-light/70",
                  )
            }`}
            onClick={() => onSetViewMode("list")}
            type="button"
          >
            <ListBulletsIcon size={11} />
          </button>
          <button
            className={`flex items-center gap-1 px-1.5 py-1 text-[11px] lowercase border ${
              viewMode === "grid"
                ? t(
                    "text-text-dark border-border-dark bg-white/5",
                    "text-text-light border-border-light bg-black/5",
                  )
                : t(
                    "text-text-dark/40 border-border-dark hover:text-text-dark/70",
                    "text-text-light/40 border-border-light hover:text-text-light/70",
                  )
            }`}
            onClick={() => onSetViewMode("grid")}
            type="button"
          >
            <SquaresFourIcon size={11} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        {(() => {
          if (isPending) {
            return (
              <p
                className={`text-center text-[12px] ${t("text-text-dark/20", "text-text-light/20")}`}
              >
                loading...
              </p>
            );
          }
          if (groupedPages.length === 0) {
            return (
              <p
                className={`mt-6 text-center text-[13px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                {activeTab === "favorites" ? "no favorites yet" : "no pages yet"}
              </p>
            );
          }
          return (
            <div className="space-y-6">
              {groupedPages.map(([dateKey, items]) => (
                <div key={dateKey}>
                  <h3
                    className={`mb-2 text-[10px] uppercase tracking-wider ${t("text-text-dark/25", "text-text-light/25")}`}
                  >
                    {formatDateHeading(dateKey)}
                  </h3>

                  {viewMode === "list" ? (
                    <div className="space-y-0.5">
                      {items.map((page) => {
                        const isFav = favorites.includes(page.id);
                        return (
                          <div
                            className={`flex items-center gap-3 rounded px-2 py-1.5 cursor-pointer ${t("hover:bg-white/5", "hover:bg-black/3")}`}
                            key={page.id}
                            onClick={() => onNavigate(page.slugId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onNavigate(page.slugId);
                              }
                            }}
                            // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role
                            role="button"
                            tabIndex={0}
                          >
                            <button
                              aria-label={isFav ? "unfavorite" : "favorite"}
                              className={`shrink-0 cursor-pointer ${isFav ? t("text-yellow-400", "text-yellow-500") : t("text-text-dark/20 hover:text-yellow-400", "text-text-light/20 hover:text-yellow-500")}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(page.id);
                              }}
                              type="button"
                            >
                              <BookmarkSimpleIcon size={13} weight={isFav ? "fill" : "regular"} />
                            </button>
                            <span
                              className={`min-w-0 flex-1 truncate text-[13px] lowercase ${t("text-text-dark/60", "text-text-light/60")}`}
                            >
                              {page.title}
                            </span>
                            {page.parentPageId &&
                              (() => {
                                const parent = treeItems?.find(
                                  (item) => item.id === page.parentPageId,
                                );
                                if (!parent) {
                                  return null;
                                }
                                return (
                                  <span
                                    className={`shrink-0 text-[10px] lowercase truncate max-w-24 ${t("text-text-dark/25", "text-text-light/25")}`}
                                  >
                                    {parent.title}
                                  </span>
                                );
                              })()}
                            <span className="flex-1" />
                            <span
                              className={`shrink-0 text-[10px] lowercase ${t("text-text-dark/25", "text-text-light/25")}`}
                            >
                              {(() => {
                                const d = new Date(page.updatedAt);
                                const now = new Date();
                                const diff = Math.floor((now.getTime() - d.getTime()) / 1000 / 60);
                                if (diff < 1) {
                                  return "just now";
                                }
                                if (diff < 60) {
                                  return `${diff}m ago`;
                                }
                                const hours = Math.floor(diff / 60);
                                if (hours < 24) {
                                  return `${hours}h ago`;
                                }
                                const days = Math.floor(hours / 24);
                                if (days < 7) {
                                  return `${days}d ago`;
                                }
                                return d.toLocaleDateString("en-US", {
                                  day: "numeric",
                                  month: "short",
                                });
                              })()}
                            </span>
                            <span
                              className={`shrink-0 text-[10px] ${t("text-text-dark/25", "text-text-light/25")}`}
                            >
                              {new Date(page.createdAt).toISOString().slice(0, 10)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {items.map((page) => {
                        const isFav = favorites.includes(page.id);
                        return (
                          <div
                            className={`flex flex-col gap-1 rounded border p-3 cursor-pointer ${t("border-border-dark hover:bg-white/5", "border-border-light hover:bg-black/3")}`}
                            key={page.id}
                            onClick={() => onNavigate(page.slugId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onNavigate(page.slugId);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex items-start justify-between">
                              <span
                                className={`min-w-0 flex-1 truncate text-[12px] lowercase ${t("text-text-dark/70", "text-text-light/70")}`}
                              >
                                {page.title}
                              </span>
                              <button
                                aria-label={isFav ? "unfavorite" : "favorite"}
                                className={`ml-1 shrink-0 cursor-pointer ${isFav ? t("text-yellow-400", "text-yellow-500") : t("text-text-dark/20 hover:text-yellow-400", "text-text-light/20 hover:text-yellow-500")}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(page.id);
                                }}
                                type="button"
                              >
                                <BookmarkSimpleIcon size={11} weight={isFav ? "fill" : "regular"} />
                              </button>
                            </div>
                            <span
                              className={`text-[9px] ${t("text-text-dark/20", "text-text-light/20")}`}
                            >
                              {new Date(page.updatedAt).toISOString().slice(0, 10)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

interface HeaderImageProps {
  headerImage: string;
  onOpenPicker: () => void;
  onRemove: () => void;
}

const HeaderImage = ({ headerImage, onOpenPicker, onRemove }: HeaderImageProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-full group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img alt="space header" className="w-full h-40 object-cover" src={headerImage} />

      {hovered && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
          <button
            className="flex items-center gap-1.5 px-2 h-7 text-[10px] lowercase border border-white/20 text-white/80 hover:bg-white/10"
            onClick={onOpenPicker}
            type="button"
          >
            <CameraIcon size={11} />
            change cover
          </button>
          <button
            className="flex items-center justify-center h-7 w-7 text-[10px] lowercase border border-white/20 text-white/80 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            type="button"
          >
            <TrashIcon size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

interface SpaceHeadingProps {
  createdAt: string | undefined;
  description: string | undefined;
  hasHeader: boolean;
  icon: string | undefined;
  isDarkMode: boolean;
  members: SpaceMemberMixed[] | undefined;
  name: string;
  onToggleFav: () => void;
  pageCount: number;
  starred: boolean;
  updatedAt: string | undefined;
  onAvatarChange: (dataUrl: string) => void;
  onEditDescription: (value: string) => void;
  onEditHeader: () => void;
  onEditName: (value: string) => void;
}

const SpaceHeading = ({
  createdAt,
  description,
  hasHeader,
  icon,
  isDarkMode,
  members,
  name,
  pageCount,
  onAvatarChange,
  updatedAt,
  onEditHeader,
  onEditDescription,
  onEditName,
  onToggleFav,
  starred,
}: SpaceHeadingProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      onAvatarChange(dataUrl);
    } catch {
      // ignore
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingDescription) {
      descriptionInputRef.current?.focus();
    }
  }, [editingDescription]);

  return (
    <>
      <div className={hasHeader ? "-mt-7 mb-1" : "pt-12 mb-1"}>
        <div
          className="relative inline-block group cursor-pointer"
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <AvatarBadge
            className={`relative z-10 w-16 h-16 border-2 ${t("border-[#171717] bg-white/10 text-text-dark/60", "border-[#e8e8e8] bg-black/5 text-text-light/60")}`}
            icon={icon ?? null}
            initialsClass="text-[0.75rem]"
            name={name}
          />
          {avatarHovered && (
            <button
              className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/40 w-16 h-16"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <CameraIcon className="text-white/80" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={nameInputRef}
              className={`text-lg lowercase bg-transparent border-b outline-none ${t("border-border-dark text-text-dark", "border-border-light text-text-light")}`}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditingName(false);
                }
              }}
              value={nameDraft}
            />
            <button
              className={`text-[10px] lowercase px-1 py-0.5 ${t("text-text-dark/40 hover:text-text-dark", "text-text-light/40 hover:text-text-light")}`}
              onClick={() => {
                const next = nameDraft.trim();
                if (next) {
                  onEditName(next);
                }
                setEditingName(false);
              }}
              type="button"
            >
              save
            </button>
            <button
              className={`text-[10px] lowercase px-2 py-0.5 ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
              onClick={() => setEditingName(false)}
              type="button"
            >
              cancel
            </button>
          </div>
        ) : (
          <h1 className={`text-lg lowercase ${t("text-text-dark", "text-text-light")}`}>{name}</h1>
        )}
        <div className="relative" ref={menuRef}>
          <button
            className={`p-0.5 ${starred ? t("text-yellow-400 hover:text-yellow-300", "text-yellow-500 hover:text-yellow-400") : t("text-text-dark/20 hover:text-yellow-400", "text-text-light/20 hover:text-yellow-500")}`}
            onClick={onToggleFav}
            type="button"
          >
            <StarIcon size={13} weight={starred ? "fill" : "regular"} />
          </button>
          <button
            className={`p-0.5 ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
            onClick={() => setMenuOpen((p) => !p)}
            type="button"
          >
            <DotsThreeVerticalIcon size={14} />
          </button>
          {menuOpen && (
            <div
              className={`absolute right-0 top-full mt-1 border p-1.5 z-50 shadow-lg w-44 ${t("border-border-dark bg-text-light", "border-border-light bg-white")}`}
            >
              <button
                className={`flex w-full items-center gap-2 px-1.5 py-1 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80 hover:bg-white/5", "text-text-light/50 hover:text-text-light/80 hover:bg-black/3")}`}
                onClick={() => {
                  fileInputRef.current?.click();
                  setMenuOpen(false);
                }}
                type="button"
              >
                <ImageIcon size={11} />
                edit avatar
              </button>
              <button
                className={`flex w-full items-center gap-2 px-1.5 py-1 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80 hover:bg-white/5", "text-text-light/50 hover:text-text-light/80 hover:bg-black/3")}`}
                onClick={() => {
                  onEditHeader();
                  setMenuOpen(false);
                }}
                type="button"
              >
                <CameraIcon size={11} />
                edit header photo
              </button>
              <button
                className={`flex w-full items-center gap-2 px-1.5 py-1 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80 hover:bg-white/5", "text-text-light/50 hover:text-text-light/80 hover:bg-black/3")}`}
                onClick={() => {
                  setNameDraft(name);
                  setEditingName(true);
                  setMenuOpen(false);
                }}
                type="button"
              >
                <PencilSimpleIcon size={11} />
                edit name
              </button>
              <button
                className={`flex w-full items-center gap-2 px-1.5 py-1 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80 hover:bg-white/5", "text-text-light/50 hover:text-text-light/80 hover:bg-black/3")}`}
                onClick={() => {
                  setDescriptionDraft(description ?? "");
                  setEditingDescription(true);
                  setMenuOpen(false);
                }}
                type="button"
              >
                <TextAlignLeftIcon size={11} />
                edit description
              </button>
            </div>
          )}
        </div>
      </div>

      {(() => {
        if (editingDescription) {
          return (
            <div className="flex items-center gap-2">
              <input
                ref={descriptionInputRef}
                className={`mt-1 text-[12px] lowercase bg-transparent border-b outline-none w-full ${t("border-border-dark text-text-dark/60", "border-border-light text-text-light/60")}`}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditingDescription(false);
                  }
                }}
                value={descriptionDraft}
              />
              <button
                className={`mt-1 shrink-0 text-[10px] lowercase px-1 py-0.5 ${t("text-text-dark/40 hover:text-text-dark", "text-text-light/40 hover:text-text-light")}`}
                onClick={() => {
                  const next = descriptionDraft.trim();
                  onEditDescription(next);
                  setEditingDescription(false);
                }}
                type="button"
              >
                save
              </button>
              <button
                className={`mt-1 shrink-0 text-[10px] lowercase px-2 py-0.5 ${t("text-text-dark/30 hover:text-text-dark/60", "text-text-light/30 hover:text-text-light/60")}`}
                onClick={() => setEditingDescription(false)}
                type="button"
              >
                cancel
              </button>
            </div>
          );
        }
        if (description) {
          return (
            <p
              className={`mt-1 text-[12px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
            >
              {description}
            </p>
          );
        }
        return null;
      })()}

      <div
        className={`mt-1.5 text-[10px] lowercase flex items-center gap-3 ${t("text-text-dark/20", "text-text-light/20")}`}
      >
        <span className="flex-1">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
          {createdAt
            ? ` · created ${new Date(createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
            : ""}
          {updatedAt
            ? ` · updated ${new Date(updatedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
            : ""}
        </span>
        {members && members.length > 0 && (
          <span className="flex items-center -space-x-1.5">
            {members.slice(0, 5).map((m) => (
              <SidebarTooltip key={m.id} label={m.name}>
                <AvatarBadge
                  className="w-5 h-5 border-2 border-current/5"
                  icon={m.avatarUrl ?? null}
                  initialsClass="text-[0.35rem]"
                  name={m.name}
                />
              </SidebarTooltip>
            ))}
            {members.length > 5 && <span className="text-[9px] ml-0.5">+{members.length - 5}</span>}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        type="file"
      />
    </>
  );
};

// eslint-disable-next-line complexity
export const SpaceOverview = () => {
  const { spaceSlug } = useParams({ from: "/s/$spaceSlug" });
  const navigate = useNavigate();
  const { data: space } = useSpaceBySlug(spaceSlug);
  const { data: treeItems, isPending: isTreePending } = usePageTree(space?.id ?? "");
  const { data: members } = useSpaceMembers(space?.id ?? "");
  const { data: user } = useAuth();
  const toggleSpaceFav = useToggleSpaceFavorite();
  const { data: favData } = useIsSpaceFavorited(space?.id ?? "");
  const { data: favPageIds } = useFavoritedPages();
  const togglePageFav = useTogglePageFavorite();
  const { isDarkMode } = useTheme();
  const updateSpace = useUpdateSpace();

  const handlePageNavigate = (pageSlug: string) => {
    navigate({ params: { pageid: pageSlug, spaceSlug }, to: "/s/$spaceSlug/p/$pageid" });
  };

  const [activeTab, setActiveTab] = useState<Tab>("recents");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showUnsplash, setShowUnsplash] = useState(false);

  const toggleFavorite = (pageId: string) => {
    togglePageFav.mutate(pageId);
  };

  const doUpdate = (updates: {
    icon?: string;
    headerImage?: string;
    name?: string;
    slug?: string;
    description?: string;
  }) => {
    if (!space || !space.id) {
      return;
    }
    updateSpace.mutate({
      id: space.id,
      input: {
        description: updates.description ?? space.description,
        headerImage: updates.headerImage ?? space.headerImage,
        icon: updates.icon ?? space.icon,
        name: updates.name ?? space.name,
        slug: updates.slug ?? space.slug,
      },
    });
  };

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const pages = useMemo(
    () => (treeItems ? treeItems.filter((p) => p.icon !== "folder") : []),
    [treeItems],
  );

  const filteredPages = useMemo(() => {
    if (activeTab === "favorites") {
      return pages.filter((p) => (favPageIds ?? []).includes(p.id));
    }
    if (activeTab === "mine") {
      return pages.filter((p) => p.creatorId === user?.id);
    }
    return pages;
  }, [pages, activeTab, favPageIds, user?.id]);

  const groupedPages = useMemo(() => {
    const sortBy = activeTab === "recents" ? "updatedAt" : "createdAt";
    return groupByDate(filteredPages, sortBy);
  }, [filteredPages, activeTab]);

  const headerImage = space?.headerImage;

  const visibleMembers = useMemo(() => {
    const list = (members ?? []).filter((m) => m.memberType === "user");
    if (user && space?.createdBy === user.id && !list.some((m) => m.userId === user.id)) {
      list.unshift({
        avatarUrl: user.avatar_url,
        id: user.id,
        joinedAt: "",
        memberType: "user" as const,
        name: user.name,
        role: "",
        spaceId: space.id,
        userId: user.id,
      });
    }
    return list;
  }, [members, user, space]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col min-h-full pb-16">
      {space ? (
        <>
          {headerImage && (
            <div className="pt-4">
              <HeaderImage
                headerImage={headerImage}
                onOpenPicker={() => setShowUnsplash(true)}
                onRemove={() => doUpdate({ headerImage: "" })}
              />
            </div>
          )}

          <div className="px-4">
            <SpaceHeading
              createdAt={space?.createdAt}
              description={space?.description}
              hasHeader={Boolean(headerImage)}
              icon={space?.icon}
              isDarkMode={isDarkMode}
              members={visibleMembers}
              name={space?.name || spaceSlug}
              pageCount={pages.length}
              updatedAt={space?.updatedAt}
              onAvatarChange={(dataUrl) => doUpdate({ icon: dataUrl })}
              onEditDescription={(v) => doUpdate({ description: v })}
              onEditHeader={() => setShowUnsplash(true)}
              onEditName={(v) =>
                doUpdate({
                  name: v,
                  slug: v
                    .toLowerCase()
                    .replaceAll(/[^\w\s-]/g, "")
                    .replaceAll(/[\s_-]+/g, "-")
                    .replaceAll(/^-+|-+$/g, ""),
                })
              }
              onToggleFav={() => toggleSpaceFav.mutate(space?.id ?? "")}
              starred={favData?.favorited ?? false}
            />

            <SpaceContentSection
              activeTab={activeTab}
              favorites={favPageIds ?? []}
              groupedPages={groupedPages}
              isDarkMode={isDarkMode}
              isPending={isTreePending}
              treeItems={treeItems}
              viewMode={viewMode}
              onNavigate={handlePageNavigate}
              onSetActiveTab={setActiveTab}
              onSetViewMode={setViewMode}
              onToggleFavorite={toggleFavorite}
            />
          </div>

          {showUnsplash && (
            <UnsplashPicker
              onClose={() => setShowUnsplash(false)}
              onSelect={(url) => {
                doUpdate({ headerImage: url });
                setShowUnsplash(false);
              }}
            />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center pt-32">
          <p className={`text-[13px] lowercase ${t("text-text-dark/25", "text-text-light/25")}`}>
            loading...
          </p>
        </div>
      )}
    </div>
  );
};
