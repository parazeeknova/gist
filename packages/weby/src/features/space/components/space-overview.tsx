import {
  CameraIcon,
  ClockCounterClockwiseIcon,
  ListBulletsIcon,
  SquaresFourIcon,
  StarIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTheme } from "#/shared/hooks/use-theme";
import { useSpaceBySlug, useUpdateSpace } from "#/features/console/hooks/use-spaces";
import { usePageTree } from "#/features/console/hooks/use-pages";
import { AvatarBadge } from "#/shared/components/avatar-badge";
import { UnsplashPicker } from "./unsplash-picker";
import type { PageTreeItem } from "#/shared/types";

type Tab = "recents" | "favorites" | "mine";
type ViewMode = "list" | "grid";

const favoritesKey = (spaceId: string) => `verso:space:${spaceId}:favorites`;

const readFavorites = (spaceId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(favoritesKey(spaceId));
    if (raw) {
      return new Set(JSON.parse(raw) as string[]);
    }
  } catch {
    // ignore
  }
  return new Set();
};

const persistFavorites = (spaceId: string, ids: Set<string>) => {
  try {
    localStorage.setItem(favoritesKey(spaceId), JSON.stringify([...ids]));
  } catch {
    // ignore
  }
};

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
  favorites: Set<string>;
  groupedPages: [string, PageTreeItem[]][];
  isDarkMode: boolean;
  isPending: boolean;
  viewMode: ViewMode;
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
  viewMode,
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
              ["favorites", StarIcon] as const,
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
                        const isFav = favorites.has(page.id);
                        return (
                          <div
                            className={`flex items-center gap-3 rounded px-2 py-1.5 ${t("hover:bg-white/5", "hover:bg-black/3")}`}
                            key={page.id}
                          >
                            <button
                              aria-label={isFav ? "unfavorite" : "favorite"}
                              className={`shrink-0 cursor-pointer ${isFav ? t("text-yellow-400", "text-yellow-500") : t("text-text-dark/20 hover:text-yellow-400", "text-text-light/20 hover:text-yellow-500")}`}
                              onClick={() => onToggleFavorite(page.id)}
                              type="button"
                            >
                              <StarIcon size={13} weight={isFav ? "fill" : "regular"} />
                            </button>
                            <span
                              className={`min-w-0 flex-1 truncate text-[13px] lowercase ${t("text-text-dark/60", "text-text-light/60")}`}
                            >
                              {page.title}
                            </span>
                            <span
                              className={`shrink-0 text-[10px] ${t("text-text-dark/25", "text-text-light/25")}`}
                            >
                              {new Date(page.updatedAt).toISOString().slice(0, 10)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {items.map((page) => {
                        const isFav = favorites.has(page.id);
                        return (
                          <div
                            className={`flex flex-col gap-1 rounded border p-3 ${t("border-border-dark hover:bg-white/5", "border-border-light hover:bg-black/3")}`}
                            key={page.id}
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
                                onClick={() => onToggleFavorite(page.id)}
                                type="button"
                              >
                                <StarIcon size={11} weight={isFav ? "fill" : "regular"} />
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
  headerImage: string | undefined;
  isDarkMode: boolean;
  onOpenPicker: () => void;
}

const HeaderImage = ({ headerImage, isDarkMode, onOpenPicker }: HeaderImageProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-full group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {headerImage ? (
        <img alt="space header" className="w-full h-40 object-cover" src={headerImage} />
      ) : (
        <div className={`w-full h-40 ${t("bg-white/3", "bg-black/3")}`} />
      )}
      <button
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"} w-full`}
        onClick={onOpenPicker}
        type="button"
      >
        <span
          className={`flex items-center gap-1.5 px-2 py-1 text-[10px] lowercase border ${headerImage ? t("border-white/20 text-white/80", "border-white/20 text-white/80") : t("border-border-dark text-text-dark/40 hover:text-text-dark/60", "border-border-light text-text-light/40 hover:text-text-light/60")}`}
        >
          <CameraIcon size={11} />
          change cover
        </span>
      </button>
    </div>
  );
};

export const SpaceOverview = () => {
  const { spaceSlug } = useParams({ from: "/s/$spaceSlug" });
  const { data: space } = useSpaceBySlug(spaceSlug);
  const { data: treeItems, isPending: isTreePending } = usePageTree(space?.id ?? "");
  const { isDarkMode } = useTheme();
  const updateSpace = useUpdateSpace();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const [activeTab, setActiveTab] = useState<Tab>("recents");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [favorites, setFavorites] = useState<Set<string>>(() => readFavorites(space?.id ?? ""));
  const [showUnsplash, setShowUnsplash] = useState(false);

  // Sync favorites when space changes
  const [lastSpaceId, setLastSpaceId] = useState(space?.id ?? "");
  if (space?.id && space.id !== lastSpaceId) {
    setLastSpaceId(space.id);
    setFavorites(readFavorites(space.id));
  }

  const toggleFavorite = (pageId: string) => {
    if (!space?.id) {
      return;
    }
    const next = new Set(favorites);
    if (next.has(pageId)) {
      next.delete(pageId);
    } else {
      next.add(pageId);
    }
    setFavorites(next);
    persistFavorites(space.id, next);
  };

  const handleSelectHeaderImage = (imageUrl: string) => {
    if (!space || !space.id) {
      return;
    }
    updateSpace.mutate({
      id: space.id,
      input: {
        description: space.description,
        headerImage: imageUrl,
        icon: space.icon,
        name: space.name,
        slug: space.slug,
      },
    });
    setShowUnsplash(false);
  };

  const pages = useMemo(() => (treeItems ? [...treeItems] : []), [treeItems]);

  const filteredPages = useMemo(() => {
    if (activeTab === "favorites") {
      return pages.filter((p) => favorites.has(p.id));
    }
    return pages;
  }, [pages, activeTab, favorites]);

  const groupedPages = useMemo(() => {
    const sortBy = activeTab === "recents" ? "updatedAt" : "createdAt";
    return groupByDate(filteredPages, sortBy);
  }, [filteredPages, activeTab]);

  const headerImage = space?.headerImage;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col min-h-full pb-16">
      <HeaderImage
        headerImage={headerImage}
        isDarkMode={isDarkMode}
        onOpenPicker={() => setShowUnsplash(true)}
      />

      <div className="px-4">
        <div className="-mt-5 mb-1">
          <AvatarBadge
            className={`w-10 h-10 border-2 ${t("border-[#171717] bg-white/10 text-text-dark/60", "border-[#e8e8e8] bg-black/5 text-text-light/60")}`}
            icon={space?.icon ?? null}
            name={space?.name ?? spaceSlug}
          />
        </div>

        <h1 className={`text-lg lowercase ${t("text-text-dark", "text-text-light")}`}>
          {space?.name || spaceSlug}
        </h1>
        {space?.description && (
          <p
            className={`mt-1 text-[12px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            {space.description}
          </p>
        )}

        <SpaceContentSection
          activeTab={activeTab}
          favorites={favorites}
          groupedPages={groupedPages}
          isDarkMode={isDarkMode}
          isPending={isTreePending}
          viewMode={viewMode}
          onSetActiveTab={setActiveTab}
          onSetViewMode={setViewMode}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      {showUnsplash && (
        <UnsplashPicker onClose={() => setShowUnsplash(false)} onSelect={handleSelectHeaderImage} />
      )}
    </div>
  );
};
