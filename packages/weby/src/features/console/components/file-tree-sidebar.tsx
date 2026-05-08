import { CaretDownIcon, CaretRightIcon, FileIcon, FolderIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { PageTreeItem, Space } from "#/shared/types";
import { AvatarBadge } from "#/shared/components/avatar-badge";
import { usePageTree } from "#/features/console/hooks/use-pages";
import { useSpaces, useFavoritedSpaces } from "#/features/console/hooks/use-spaces";
import { useTheme } from "#/shared/hooks/use-theme";
import { useConsoleContext } from "./console-context";

interface TreeNode {
  item: PageTreeItem;
  children: TreeNode[];
}

const buildPageTree = (items: PageTreeItem[]): TreeNode[] => {
  if (!items || items.length === 0) {
    return [];
  }
  const byParent = new Map<string | null, PageTreeItem[]>();
  for (const item of items) {
    const key = item.parentPageId;
    const list = byParent.get(key);
    if (list) {
      list.push(item);
    } else {
      byParent.set(key, [item]);
    }
  }
  const build = (parentId: string | null): TreeNode[] => {
    const children = byParent.get(parentId) ?? [];
    return children.map((item) => ({
      children: build(item.id),
      item,
    }));
  };
  return build(null);
};

interface PageNodeProps {
  node: TreeNode;
  depth: number;
}

const PageNode = ({ node, depth }: PageNodeProps) => {
  const { isDarkMode } = useTheme();
  const { selectedPageId, setSelectedPageId } = useConsoleContext();
  const [expanded, setExpanded] = useState(true);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedPageId === node.item.id;

  return (
    <li>
      <div
        className={`flex w-full items-center gap-1 py-0.5 text-[11px] lowercase ${t(
          isSelected
            ? "bg-white/10 text-text-dark"
            : "text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80",
          isSelected
            ? "bg-black/10 text-text-light"
            : "text-text-light/50 hover:bg-black/3 hover:text-text-light/80",
        )}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <>
            <button
              className="shrink-0 cursor-pointer"
              onClick={() => setExpanded((prev) => !prev)}
              type="button"
            >
              {expanded ? <CaretDownIcon size={10} /> : <CaretRightIcon size={10} />}
            </button>
            <FolderIcon className="shrink-0" size={10} />
          </>
        ) : (
          <FileIcon className="shrink-0" size={10} />
        )}
        <button
          className="flex-1 text-left truncate"
          onClick={() => setSelectedPageId(node.item.id)}
          type="button"
        >
          {node.item.title}
        </button>
      </div>
      {expanded && hasChildren && (
        <ul>
          {node.children.map((child) => (
            <PageNode depth={depth + 1} key={child.item.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

interface SpaceTreeNodeProps {
  space: Space;
  defaultExpanded: boolean;
}

const SpaceTreeNode = ({ space, defaultExpanded }: SpaceTreeNodeProps) => {
  const { isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data: treeItems, isPending, isError } = usePageTree(space.id);

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const pageTree = treeItems ? buildPageTree(treeItems) : [];

  return (
    <div>
      <button
        className={`flex w-full items-center gap-1 px-1 py-0.5 text-[11px] lowercase ${t(
          "text-text-dark/60 hover:text-text-dark/80",
          "text-text-light/60 hover:text-text-light/80",
        )}`}
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
      >
        {expanded ? <CaretDownIcon size={10} /> : <CaretRightIcon size={10} />}
        <AvatarBadge
          className={`mx-0.5 h-3.5 w-3.5 ${t("bg-white/10 text-text-dark/60", "bg-black/5 text-text-light/60")}`}
          icon={space.icon}
          name={space.name}
        />
        <span className="truncate">{space.name}</span>
      </button>
      {expanded && (
        <div className="pl-2">
          {(() => {
            if (isPending) {
              return (
                <p
                  className={`px-1 py-0.5 text-[10px] ${t("text-text-dark/25", "text-text-light/25")}`}
                >
                  loading...
                </p>
              );
            }
            if (isError) {
              return <p className="px-1 py-0.5 text-[10px] text-red-400">failed to load</p>;
            }
            if (pageTree.length === 0) {
              return (
                <p
                  className={`px-1 py-0.5 text-[10px] ${t("text-text-dark/25", "text-text-light/25")}`}
                >
                  no files here
                </p>
              );
            }
            return (
              <ul>
                {pageTree.map((node) => (
                  <PageNode depth={0} key={node.item.id} node={node} />
                ))}
              </ul>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export const FileTreeSidebar = () => {
  const { isDarkMode } = useTheme();
  const { selectedWorkspaceId, selectedSpaceId } = useConsoleContext();
  const { data: spaces, isPending, isError } = useSpaces(selectedWorkspaceId);
  const { data: favSpaces } = useFavoritedSpaces();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <>
      <div className="mb-1 flex items-center justify-between px-1">
        <p
          className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          my files
        </p>
        <button
          className={`text-[10px] uppercase tracking-wider ${t("text-text-dark/20 hover:text-text-dark/40", "text-text-light/20 hover:text-text-light/40")}`}
          type="button"
        >
          + new
        </button>
      </div>
      <div className="max-h-[45%] overflow-y-auto">
        {(() => {
          if (!selectedWorkspaceId) {
            return (
              <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                select a workspace
              </p>
            );
          }
          if (isPending) {
            return (
              <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                loading spaces...
              </p>
            );
          }
          if (isError) {
            return <p className="px-1 text-[11px] text-red-400">failed to load spaces</p>;
          }
          if (!spaces || spaces.length === 0) {
            return (
              <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                no spaces yet
              </p>
            );
          }
          return (
            <div className="space-y-0.5">
              {spaces.map((space) => {
                const isSelected = selectedSpaceId === space.id;
                return <SpaceTreeNode defaultExpanded={isSelected} key={space.id} space={space} />;
              })}
            </div>
          );
        })()}
      </div>
      <div className="mt-4">
        <p
          className={`px-1 mb-1 text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          favorites
        </p>
        {(() => {
          if (!favSpaces || favSpaces.length === 0) {
            return (
              <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                no favorites yet
              </p>
            );
          }
          return (
            <div className="space-y-0.5">
              {favSpaces.map((s) => (
                <a
                  className={`flex items-center gap-2 px-1 py-1 text-[11px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
                  href={`/s/${s.slug}`}
                  key={s.id}
                >
                  <AvatarBadge
                    className="w-4 h-4"
                    icon={s.icon || null}
                    initialsClass="text-[0.25rem]"
                    name={s.name}
                  />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span
                    className={`shrink-0 text-[8px] px-1 py-0.5 border lowercase ${t("border-border-dark text-text-dark/25", "border-border-light text-text-light/25")}`}
                  >
                    space
                  </span>
                </a>
              ))}
            </div>
          );
        })()}
      </div>
    </>
  );
};
