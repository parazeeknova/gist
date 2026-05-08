import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretRightIcon,
  FileIcon,
  FolderIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { PageTreeItem, Space } from "#/shared/types";
import { usePageTree } from "#/features/console/hooks/use-pages";
import { useTheme } from "#/shared/hooks/use-theme";
import { useConsoleContext } from "#/features/console/components/console-context";

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
    const list = byParent.get(item.parentPageId);
    if (list) {
      list.push(item);
    } else {
      byParent.set(item.parentPageId, [item]);
    }
  }
  const build = (parentId: string | null): TreeNode[] => {
    const children = byParent.get(parentId) ?? [];
    return children.map((item) => ({ children: build(item.id), item }));
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

interface SpaceSidebarProps {
  space: Space;
}

export const SpaceSidebar = ({ space }: SpaceSidebarProps) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { location } = routerState;
  const { data: treeItems, isPending } = usePageTree(space.id);
  const isOverview = location.pathname === `/s/${space.slug}`;

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const pageTree = treeItems ? buildPageTree(treeItems) : [];

  return (
    <div className="min-h-0 w-70 flex-1 flex flex-col overflow-y-auto px-4">
      <div
        className={`flex items-center justify-between px-1 py-2 border-b ${t("border-border-dark", "border-border-light")}`}
      >
        <button
          className={`flex items-center gap-1.5 text-[11px] lowercase ${t("text-text-dark/70 hover:text-text-dark/90", "text-text-light/70 hover:text-text-light/90")}`}
          onClick={() => navigate({ to: "/home" })}
          type="button"
        >
          <ArrowLeftIcon size={12} />
          back
        </button>
        <div className="flex items-center gap-1 text-[11px] text-text-dark/40 lowercase">
          <span className="truncate max-w-30 uppercase font-bold">{space.name}</span> -
          <span className="truncate max-w-20">{space.description}</span>
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`px-1 mb-1 text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          space
        </p>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${
            isOverview
              ? t("bg-white/10 text-text-dark", "bg-black/10 text-text-light")
              : t(
                  "text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80",
                  "text-text-light/50 hover:bg-black/3 hover:text-text-light/80",
                )
          }`}
          onClick={() => navigate({ to: `/s/${space.slug}` })}
          type="button"
        >
          <SquaresFourIcon size={12} />
          overview
        </button>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${t("text-text-dark/25", "text-text-light/25")} cursor-not-allowed opacity-40`}
          type="button"
        >
          <MagnifyingGlassIcon size={12} />
          search
        </button>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
          onClick={() =>
            navigate({ search: { workspace: space.workspaceId }, to: "/settings/spaces" })
          }
          type="button"
        >
          <GearSixIcon size={12} />
          space settings
        </button>
        <button
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
          type="button"
        >
          <PlusIcon size={12} />
          new page
        </button>
      </div>

      <div className="mt-4 flex-1 flex flex-col min-h-0">
        <p
          className={`px-1 mb-1 text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
        >
          pages
        </p>
        <div className="flex-1 overflow-y-auto">
          {(() => {
            if (isPending) {
              return (
                <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                  loading...
                </p>
              );
            }
            if (pageTree.length === 0) {
              return (
                <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                  no pages yet
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
      </div>
    </div>
  );
};
