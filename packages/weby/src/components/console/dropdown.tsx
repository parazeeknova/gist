import { CaretDownIcon } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../hooks/use-theme";

interface DropdownProps {
  value: number;
  options: number[];
  onChange: (value: number) => void;
}

export const Dropdown = ({ value, options, onChange }: DropdownProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        className={`flex items-center gap-0.5 text-[11px] lowercase outline-none cursor-pointer ${t("text-text-dark/50 hover:text-text-dark/70", "text-text-light/50 hover:text-text-light/70")}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {value}
        <CaretDownIcon className="size-2.5" />
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 mt-0.5 border text-[11px] lowercase overflow-hidden z-50 shadow-lg ${t("border-border-dark bg-bg-dark text-text-dark/70", "border-border-light bg-bg-light text-text-light/70")}`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              className={`block w-full px-3 py-1 text-left cursor-pointer ${opt === value ? t("bg-white/5 text-text-dark", "bg-black/5 text-text-light") : t("hover:bg-white/5 hover:text-text-dark/80", "hover:bg-black/5 hover:text-text-light/80")}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
