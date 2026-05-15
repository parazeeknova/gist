import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  DotsThreeVerticalIcon,
  LinkSimpleIcon,
  ArticleIcon,
  EyeSlashIcon,
  ArrowsInIcon,
  ClockCounterClockwiseIcon,
  ArrowSquareOutIcon,
  FileArrowDownIcon,
  PrinterIcon,
  TrashIcon,
  SquaresFourIcon,
  TextAlignLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useTheme } from "#/shared/hooks/use-theme";
import { useUserById } from "#/features/console/hooks/use-users";

interface EditorMoreMenuProps {
  pageId: string;
  title: string;
  spaceName?: string;
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  textContent?: string;
}

const formatDateTime = (iso?: string) => {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateShort = (iso?: string) => {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
};

const wordCount = (text?: string) => {
  if (!text) {
    return 0;
  }
  return text.split(/\s+/).filter(Boolean).length;
};

interface DateTooltipProps {
  createdAt?: string;
  updatedAt?: string;
  t: (dark: string, light: string) => string;
}

const DateTooltip = ({ createdAt, updatedAt, t }: DateTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative flex items-center gap-1.5 px-3 py-0.5 text-[10px] cursor-default ${t("text-text-dark/30", "text-text-light/30")}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="flex items-center justify-center w-4">
        <ClockIcon size={12} />
      </span>
      <span>
        updated:{" "}
        <span className={t("text-text-dark/50", "text-text-light/50")}>
          {formatDateShort(updatedAt)}
        </span>
      </span>
      {isVisible && (
        <div className="pointer-events-none absolute inset-x-0 top-full z-50 mt-1.5 flex justify-start">
          <div
            className={`relative whitespace-nowrap px-2.5 py-1.5 text-[10px] shadow-lg ${t("bg-neutral-800 text-white", "bg-neutral-100 text-black border border-black/10")}`}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={10} />
              created: {formatDateTime(createdAt)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <ClockIcon size={10} />
              updated: {formatDateTime(updatedAt)}
            </div>
            <div
              className={`absolute left-3 bottom-full h-1.5 w-1.5 rotate-45 ${t("bg-neutral-800", "bg-neutral-100")}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface CreatorTooltipProps {
  creatorId?: string;
  t: (dark: string, light: string) => string;
}

const CreatorTooltip = ({ creatorId, t }: CreatorTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { data: user } = useUserById(creatorId ?? "");

  const displayName = user?.name || user?.username || "unknown";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative flex items-center gap-1.5 px-3 py-0.5 text-[10px] cursor-default ${t("text-text-dark/30", "text-text-light/30")}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-medium ${t("bg-white/10 text-text-dark/60", "bg-black/10 text-text-light/60")}`}
      >
        {user?.avatar_url ? (
          <img
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
            src={user.avatar_url}
          />
        ) : (
          initials
        )}
      </div>
      <span className="truncate">{displayName}</span>
      {isVisible && user && (
        <div className="pointer-events-none absolute inset-x-0 top-full z-50 mt-1.5 flex justify-start">
          <div
            className={`relative whitespace-nowrap px-2.5 py-1.5 text-[10px] shadow-lg ${t("bg-neutral-800 text-white", "bg-neutral-100 text-black border border-black/10")}`}
          >
            <div className="flex items-center gap-2">
              <UserIcon size={10} />
              name: {user.name || "—"}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-4" />@{user.username}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-4" />
              {user.email}
            </div>
            <div
              className={`absolute left-3 bottom-full h-1.5 w-1.5 rotate-45 ${t("bg-neutral-800", "bg-neutral-100")}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const EditorMoreMenu = ({
  pageId: _pageId,
  title: _title,
  spaceName,
  creatorId,
  createdAt,
  updatedAt,
  textContent,
}: EditorMoreMenuProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) {
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 192;
    let left = rect.right - 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    setPos({ left, top: rect.bottom + 6 });
  }, []);

  const toggle = useCallback(() => {
    if (!open) {
      updatePosition();
    }
    setOpen((prev) => !prev);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onMouseDown = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const menuItem = (
    icon: React.ReactNode,
    label: string,
    onClick?: () => void,
    danger?: boolean,
  ) => (
    <button
      className={`flex w-full items-center gap-2 px-3 py-1 text-[11px] lowercase transition-colors ${danger ? t("text-red-400 hover:bg-red-400/10", "text-red-500 hover:bg-red-500/10") : t("text-text-dark/60 hover:bg-white/5 hover:text-text-dark", "text-text-light/60 hover:bg-black/5 hover:text-text-light")}`}
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
    >
      <span className="flex items-center justify-center w-4">{icon}</span>
      {label}
    </button>
  );

  const statItem = (icon: React.ReactNode, label: string, value: string) => (
    <div
      className={`flex items-center gap-1.5 px-3 py-0.5 text-[10px] ${t("text-text-dark/30", "text-text-light/30")}`}
    >
      <span className="flex items-center justify-center w-4">{icon}</span>
      <span>
        {label}: <span className={t("text-text-dark/50", "text-text-light/50")}>{value}</span>
      </span>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        className={`p-0.5 ${t("text-text-dark/40 hover:text-text-dark", "text-text-light/40 hover:text-text-light")}`}
        onClick={toggle}
      >
        <DotsThreeVerticalIcon size={14} />
      </button>
      {open &&
        createPortal(
          <>
            <div ref={menuRef} className="fixed z-9999" style={{ left: pos.left, top: pos.top }}>
              <div
                className={`w-48 border py-1 ${t("border-border-dark bg-text-light", "border-border-light bg-white")}`}
              >
                <div className="py-0.5">
                  {menuItem(<LinkSimpleIcon size={12} />, "copy link")}
                  {menuItem(<ArticleIcon size={12} />, "copy as markdown")}
                </div>
                <div
                  className={`mx-3 my-0.5 border-t ${t("border-border-dark", "border-border-light")}`}
                />
                <div className="py-0.5">
                  {menuItem(<EyeSlashIcon size={12} />, "stop watching")}
                  {menuItem(<ArrowsInIcon size={12} />, "full width")}
                </div>
                <div
                  className={`mx-3 my-0.5 border-t ${t("border-border-dark", "border-border-light")}`}
                />
                <div className="py-0.5">
                  {menuItem(<ClockCounterClockwiseIcon size={12} />, "page history")}
                  {menuItem(<ArrowSquareOutIcon size={12} />, "move")}
                  {menuItem(<FileArrowDownIcon size={12} />, "export")}
                  {menuItem(<PrinterIcon size={12} />, "print pdf")}
                </div>
                <div
                  className={`mx-3 my-1 border-t ${t("border-border-dark", "border-border-light")}`}
                />
                <div className="py-0.5">
                  {menuItem(<TrashIcon size={12} />, "delete", undefined, true)}
                </div>
                <div
                  className={`mx-3 my-0.5 border-t ${t("border-border-dark", "border-border-light")}`}
                />
                <div className="py-0.5">
                  {creatorId && <CreatorTooltip creatorId={creatorId} t={t} />}
                  {statItem(<SquaresFourIcon size={12} />, "space", spaceName ?? "—")}
                  {statItem(
                    <TextAlignLeftIcon size={12} />,
                    "words",
                    String(wordCount(textContent)),
                  )}
                  <DateTooltip createdAt={createdAt} updatedAt={updatedAt} t={t} />
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};
