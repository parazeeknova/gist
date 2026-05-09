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
  DotsThreeVerticalIcon,
  StarIcon,
  PencilSimpleIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { PageTreeItem, Space } from "#/shared/types";
import {
  useCreatePage,
  useDeletePage,
  usePageTree,
  useUpdatePage,
} from "#/features/console/hooks/use-pages";
import { useTheme } from "#/shared/hooks/use-theme";
import { useConsoleContext } from "#/features/console/components/console-context";

const toSlug = (title: string): string =>
  title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

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

interface ContextMenuState {
  x: number;
  y: number;
  pageId: string;
  title: string;
}

interface PageNodeProps {
  node: TreeNode;
  depth: number;
  spaceId: string;
}

const PageNode = ({ node, depth, spaceId }: PageNodeProps) => {
  const { isDarkMode } = useTheme();
  const { selectedPageId, setSelectedPageId } = useConsoleContext();
  const [expanded, setExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const childInputRef = useRef<HTMLInputElement>(null);

  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  const createPage = useCreatePage();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const hasChildren = node.children.length > 0 || isCreatingChild;
  const isSelected = selectedPageId === node.item.id;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        setShowDeleteConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (isCreatingChild && childInputRef.current) {
      childInputRef.current.focus();
    }
  }, [isCreatingChild]);

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      pageId: node.item.id,
      title: node.item.title,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 4,
    });
  };

  const startRename = () => {
    setRenameTitle(node.item.title);
    setIsRenaming(true);
    setContextMenu(null);
    setShowDeleteConfirm(false);
  };

  const submitRename = () => {
    const trimmed = renameTitle.trim();
    if (!trimmed || trimmed === node.item.title) {
      setIsRenaming(false);
      return;
    }
    updatePage.mutate({ id: node.item.id, input: { title: trimmed } });
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  };

  const submitDelete = () => {
    deletePage.mutate(node.item.id);
    setContextMenu(null);
    setShowDeleteConfirm(false);
  };

  const submitCreateChild = () => {
    const trimmed = newChildTitle.trim();
    if (!trimmed) {
      setIsCreatingChild(false);
      return;
    }
    createPage.mutate({
      parentPageId: node.item.id,
      slugId: toSlug(trimmed),
      spaceId,
      title: trimmed,
    });
    setNewChildTitle("");
    setIsCreatingChild(false);
  };

  const handleChildKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitCreateChild();
    } else if (e.key === "Escape") {
      setIsCreatingChild(false);
    }
  };

  return (
    <li>
      <div
        className={`flex group w-full items-center gap-1 py-0.5 text-[11px] lowercase ${t(
          isSelected
            ? "bg-white/10 text-text-dark"
            : "text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80",
          isSelected
            ? "bg-black/10 text-text-light"
            : "text-text-light/50 hover:bg-black/3 hover:text-text-light/80",
        )}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          if (!contextMenu) {
            // keep menu if open
          }
        }}
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

        {isRenaming ? (
          <input
            ref={renameInputRef}
            className={`flex-1 bg-transparent outline-none text-[11px] lowercase border-b ${t("border-white/20 text-text-dark", "border-black/20 text-text-light")}`}
            onBlur={submitRename}
            onChange={(e) => setRenameTitle(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            value={renameTitle}
          />
        ) : (
          <button
            className="flex-1 text-left truncate"
            onClick={() => setSelectedPageId(node.item.id)}
            type="button"
          >
            {node.item.title}
          </button>
        )}

        {isHovered && !isRenaming && (
          <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
            <button className="cursor-pointer opacity-60 hover:opacity-100" type="button">
              <StarIcon size={10} />
            </button>
            {node.children.length > 0 && (
              <button
                className="cursor-pointer opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingChild(true);
                  setExpanded(true);
                }}
                title="Add child page"
                type="button"
              >
                <PlusIcon size={10} />
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                className="cursor-pointer opacity-60 hover:opacity-100"
                onClick={handleDotsClick}
                type="button"
              >
                <DotsThreeVerticalIcon size={10} />
              </button>
              {contextMenu && contextMenu.pageId === node.item.id && (
                <div
                  className={`absolute z-50 left-1/2 -translate-x-1/2 mt-1 py-1 w-32 text-[11px] lowercase shadow-lg ${
                    showDeleteConfirm
                      ? ""
                      : t(
                          "bg-neutral-800 border border-white/10 text-text-dark",
                          "bg-white border border-black/10 text-text-light",
                        )
                  }`}
                  style={{ top: "100%" }}
                >
                  {showDeleteConfirm ? (
                    <div className="px-2 py-1 flex flex-col gap-1">
                      <p className={t("text-text-dark/70", "text-text-light/70")}>
                        delete &quot;{contextMenu.title}&quot;?
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          className={`px-1.5 py-0.5 cursor-pointer ${t("bg-red-600 hover:bg-red-500 text-white", "bg-red-500 hover:bg-red-400 text-white")}`}
                          onClick={submitDelete}
                          type="button"
                        >
                          delete
                        </button>
                        <button
                          className={`px-1.5 py-0.5 cursor-pointer ${t("hover:bg-white/10", "hover:bg-black/5")}`}
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setContextMenu(null);
                          }}
                          type="button"
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className={`flex w-full items-center gap-1.5 px-2 py-1 cursor-pointer ${t("hover:bg-white/10", "hover:bg-black/5")}`}
                        onClick={startRename}
                        type="button"
                      >
                        <PencilSimpleIcon size={10} />
                        rename
                      </button>
                      <button
                        className={`flex w-full items-center gap-1.5 px-2 py-1 cursor-pointer ${t("hover:bg-white/10", "hover:bg-black/5")}`}
                        onClick={() => setShowDeleteConfirm(true)}
                        type="button"
                      >
                        <TrashIcon size={10} />
                        delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <ul>
          {node.children.map((child) => (
            <PageNode depth={depth + 1} key={child.item.id} node={child} spaceId={spaceId} />
          ))}
          {isCreatingChild && (
            <li>
              <div
                className={`flex items-center gap-1 py-0.5 text-[11px] lowercase ${t("text-text-dark/50", "text-text-light/50")}`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
              >
                <FileIcon className="shrink-0" size={10} />
                <input
                  ref={childInputRef}
                  className="flex-1 bg-transparent outline-none text-[11px] lowercase border-b border-dashed border-text-dark/20"
                  onBlur={submitCreateChild}
                  onChange={(e) => setNewChildTitle(e.target.value)}
                  onKeyDown={handleChildKeyDown}
                  placeholder="new page..."
                  value={newChildTitle}
                />
                <button
                  className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
                  onClick={submitCreateChild}
                  type="button"
                >
                  <CheckIcon size={10} />
                </button>
                <button
                  className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
                  onClick={() => setIsCreatingChild(false)}
                  type="button"
                >
                  <XIcon size={10} />
                </button>
              </div>
            </li>
          )}
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
  const isSettings = location.pathname === `/s/${space.slug}/settings`;

  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [newRootTitle, setNewRootTitle] = useState("");
  const createInputRef = useRef<HTMLInputElement>(null);

  const createPage = useCreatePage();

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const pageTree = treeItems ? buildPageTree(treeItems) : [];

  useEffect(() => {
    if (isCreatingRoot && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreatingRoot]);

  const submitCreateRoot = () => {
    const trimmed = newRootTitle.trim();
    if (!trimmed) {
      setIsCreatingRoot(false);
      return;
    }
    createPage.mutate({
      slugId: toSlug(trimmed),
      spaceId: space.id,
      title: trimmed,
    });
    setNewRootTitle("");
    setIsCreatingRoot(false);
  };

  const handleRootKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitCreateRoot();
    } else if (e.key === "Escape") {
      setIsCreatingRoot(false);
    }
  };

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
          className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${
            isSettings
              ? t("bg-white/10 text-text-dark", "bg-black/10 text-text-light")
              : t(
                  "text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80",
                  "text-text-light/50 hover:bg-black/3 hover:text-text-light/80",
                )
          }`}
          onClick={() => navigate({ to: `/s/${space.slug}/settings` })}
          type="button"
        >
          <GearSixIcon size={12} />
          space settings
        </button>

        {isCreatingRoot ? (
          <div className="flex items-center gap-1 px-1 py-1">
            <FileIcon className="shrink-0" size={10} />
            <input
              ref={createInputRef}
              className={`flex-1 bg-transparent outline-none text-[11px] lowercase border-b border-dashed ${t("border-white/20 text-text-dark", "border-black/20 text-text-light")}`}
              onBlur={submitCreateRoot}
              onChange={(e) => setNewRootTitle(e.target.value)}
              onKeyDown={handleRootKeyDown}
              placeholder="page title..."
              value={newRootTitle}
            />
            <button
              className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
              onClick={submitCreateRoot}
              type="button"
            >
              <CheckIcon size={12} />
            </button>
            <button
              className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
              onClick={() => setIsCreatingRoot(false)}
              type="button"
            >
              <XIcon size={12} />
            </button>
          </div>
        ) : (
          <button
            className={`flex w-full items-center gap-2 px-1 py-1.5 text-left text-[11px] lowercase ${t("text-text-dark/50 hover:bg-white/5 hover:text-text-dark/80", "text-text-light/50 hover:bg-black/3 hover:text-text-light/80")}`}
            onClick={() => setIsCreatingRoot(true)}
            type="button"
          >
            <PlusIcon size={12} />
            new page
          </button>
        )}
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
            if (pageTree.length === 0 && !isCreatingRoot) {
              return (
                <p className={`px-1 text-[11px] ${t("text-text-dark/25", "text-text-light/25")}`}>
                  no pages yet
                </p>
              );
            }
            return (
              <ul>
                {pageTree.map((node) => (
                  <PageNode depth={0} key={node.item.id} node={node} spaceId={space.id} />
                ))}
              </ul>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
