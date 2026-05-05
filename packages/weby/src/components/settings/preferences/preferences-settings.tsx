import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useTheme } from "#/hooks/use-theme";
import type { ThemePreference } from "#/hooks/use-theme";
import { Check } from "#/components/console/check";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "light", value: "light" },
  { label: "dark", value: "dark" },
  { label: "system", value: "system" },
];

const EDIT_MODE_OPTIONS = ["edit", "read"] as const;

interface DropdownProps<T extends string> {
  disabled?: boolean;
  options: { label: string; value: T }[];
  tooltip?: string;
  value: T;
  onChange: (value: T) => void;
}

const Dropdown = <T extends string>({
  disabled,
  options,
  tooltip,
  value,
  onChange,
}: DropdownProps<T>) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleScrollOrResize = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) {
      return;
    }
    const nextOpen = !open;
    if (nextOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ left: rect.left, top: rect.bottom + 4 });
    }
    setOpen(nextOpen);
  };

  const menu = (
    <div
      ref={menuRef}
      className={`absolute border text-[11px] lowercase overflow-hidden z-[9999] shadow-lg w-40 ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
      style={{ left: pos.left, top: pos.top }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`block w-full px-3 py-2 text-left cursor-pointer ${opt.value === value ? t("bg-white/5 text-text-dark/90", "bg-black/5 text-text-light/90") : t("hover:bg-white/5 hover:text-text-dark/80", "hover:bg-black/5 hover:text-text-light/80")}`}
          onClick={() => {
            onChange(opt.value);
            setOpen(false);
          }}
          type="button"
        >
          <span
            className={`block ${opt.value === value ? t("text-text-dark", "text-text-light") : t("text-text-dark/70", "text-text-light/70")}`}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );

  if (disabled) {
    return (
      <div className="group relative inline-flex">
        <span
          className={`text-[11px] lowercase cursor-not-allowed ${t("text-text-dark/20", "text-text-light/20")}`}
        >
          {options.find((o) => o.value === value)?.label ?? value}
        </span>
        {tooltip && (
          <span
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-[9px] lowercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${t("bg-neutral-800 text-neutral-200 border-neutral-700", "bg-neutral-200 text-neutral-800 border-neutral-300")}`}
          >
            {tooltip}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        className={`flex items-center gap-0.5 text-[11px] lowercase outline-none cursor-pointer ${t("text-text-dark/70 hover:text-text-dark/90", "text-text-light/70 hover:text-text-light/90")}`}
        onClick={handleToggle}
        type="button"
      >
        {options.find((o) => o.value === value)?.label ?? value}
        <CaretDownIcon className="size-2.5" />
      </button>
      {open && createPortal(menu, document.body)}
    </>
  );
};

interface NotificationItemProps {
  description: string;
  disabled?: boolean;
  isDarkMode: boolean;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NotificationItem = ({
  description,
  disabled,
  isDarkMode,
  label,
  checked,
  onChange,
}: NotificationItemProps) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  if (disabled) {
    return (
      <div className="group relative py-3 border-b last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className={`text-[11px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}
            >
              {label}
            </span>
            <span
              className={`text-[10px] lowercase mt-0.5 ${t("text-text-dark/15", "text-text-light/15")}`}
            >
              {description}
            </span>
          </div>
          <span className="inline-block w-3 h-3" />
        </div>
        <span
          className={`absolute bottom-full right-0 mb-1 px-1.5 py-0.5 text-[9px] lowercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${t("bg-neutral-800 text-neutral-200 border-neutral-700", "bg-neutral-200 text-neutral-800 border-neutral-300")}`}
        >
          coming soon
        </span>
      </div>
    );
  }

  return (
    <div className="py-3 border-b last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className={`text-[11px] lowercase ${t("text-text-dark/70", "text-text-light/70")}`}>
            {label}
          </span>
          <span
            className={`text-[10px] lowercase mt-0.5 ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            {description}
          </span>
        </div>
        <Check checked={checked} onChange={() => onChange(!checked)} />
      </div>
    </div>
  );
};

const SectionTitle = ({
  children,
  isDarkMode,
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
}) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  return (
    <p
      className={`text-[10px] uppercase tracking-wider mb-3 ${t("text-text-dark/30", "text-text-light/30")}`}
    >
      {children}
    </p>
  );
};

const SettingRow = ({
  children,
  isDarkMode,
  label,
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
  label: string;
}) => {
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <span className={`text-[11px] lowercase ${t("text-text-dark/70", "text-text-light/70")}`}>
        {label}
      </span>
      {children}
    </div>
  );
};

export const PreferencesSettings = () => {
  const { isDarkMode, setThemePreference } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof localStorage === "undefined") {
      return "dark";
    }
    const stored = localStorage.getItem("theme-preference");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    const legacy = localStorage.getItem("theme");
    if (legacy === "light" || legacy === "dark") {
      return legacy;
    }
    return "dark";
  });

  const [editMode] = useState<"edit" | "read">("edit");
  const [notifications, setNotifications] = useState({
    commentMentions: false,
    newComments: false,
    pageMentions: false,
    pageUpdates: false,
    resolvedComments: false,
  });

  const handleThemeChange = useCallback(
    (value: ThemePreference) => {
      setTheme(value);
      setThemePreference(value);
    },
    [setThemePreference],
  );

  const toggleNotification = useCallback((key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const notificationItems = useMemo(
    () => [
      {
        description: "receive notifications when the pages you watch are updated.",
        key: "pageUpdates" as const,
        label: "page updates",
      },
      {
        description: "receive notifications when someone mentions you on a page.",
        key: "pageMentions" as const,
        label: "page mentions",
      },
      {
        description: "receive notifications when someone mentions you in a comment.",
        key: "commentMentions" as const,
        label: "comment mentions",
      },
      {
        description:
          "receive notifications about new comments in threads you are participating in.",
        key: "newComments" as const,
        label: "new comments",
      },
      {
        description: "receive a notification when your comment is resolved.",
        key: "resolvedComments" as const,
        label: "resolved comments",
      },
    ],
    [],
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        preferences
      </h1>

      {/* Appearance */}
      <div className="mb-8">
        <SectionTitle isDarkMode={isDarkMode}>appearance</SectionTitle>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          <SettingRow isDarkMode={isDarkMode} label="theme">
            <Dropdown options={THEME_OPTIONS} value={theme} onChange={handleThemeChange} />
          </SettingRow>
          <SettingRow isDarkMode={isDarkMode} label="language">
            <Dropdown
              disabled
              options={[{ label: "english", value: "en" }]}
              tooltip="coming soon"
              value="en"
              onChange={noop}
            />
          </SettingRow>
          <SettingRow isDarkMode={isDarkMode} label="full page width">
            <div className="group relative inline-flex">
              <span
                className={`text-[11px] lowercase cursor-not-allowed ${t("text-text-dark/20", "text-text-light/20")}`}
              >
                off
              </span>
              <span
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-[9px] lowercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${t("bg-neutral-800 text-neutral-200 border-neutral-700", "bg-neutral-200 text-neutral-800 border-neutral-300")}`}
              >
                coming soon
              </span>
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Editor */}
      <div className="mb-8">
        <SectionTitle isDarkMode={isDarkMode}>editor</SectionTitle>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          <SettingRow isDarkMode={isDarkMode} label="default edit mode">
            <div className="group relative inline-flex">
              <Dropdown
                disabled
                options={EDIT_MODE_OPTIONS.map((v) => ({ label: v, value: v }))}
                tooltip="coming soon"
                value={editMode}
                onChange={noop}
              />
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <SectionTitle isDarkMode={isDarkMode}>email notifications</SectionTitle>
        <div className={`border ${t("border-border-dark", "border-border-light")} px-3`}>
          {notificationItems.map((item) => (
            <NotificationItem
              key={item.key}
              checked={notifications[item.key]}
              description={item.description}
              disabled
              isDarkMode={isDarkMode}
              label={item.label}
              onChange={() => toggleNotification(item.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
