import { Check as CheckIcon, Minus as MinusIcon } from "@phosphor-icons/react";
import { useTheme } from "../../hooks/use-theme";

interface CheckProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}

export const Check = ({ checked, indeterminate, onChange, size = "sm" }: CheckProps) => {
  const { isDarkMode } = useTheme();
  const isMd = size === "md";

  const label = (() => {
    if (indeterminate) {
      return "Deselect all";
    }
    if (checked) {
      return "Deselect";
    }
    return "Select";
  })();

  const stateValue = (() => {
    if (indeterminate) {
      return "indeterminate";
    }
    if (checked) {
      return "checked";
    }
    return "unchecked";
  })();

  return (
    <label
      className={[
        "peer relative inline-flex shrink-0 items-center justify-center rounded-[4px] border cursor-pointer transition-colors duration-500 ease-out",
        "focus-within:ring-2 focus-within:ring-offset-1",
        isDarkMode
          ? [
              "border-neutral-700 bg-neutral-800 hover:border-neutral-600",
              "has-[:checked]:border-neutral-600 has-[:checked]:bg-neutral-700",
              "has-[:indeterminate]:border-neutral-600 has-[:indeterminate]:bg-neutral-700",
              "focus-within:ring-neutral-500 focus-within:ring-offset-neutral-950",
            ].join(" ")
          : [
              "border-neutral-300 bg-white hover:border-neutral-400",
              "has-[:checked]:border-neutral-500 has-[:checked]:bg-neutral-600",
              "has-[:indeterminate]:border-neutral-500 has-[:indeterminate]:bg-neutral-600",
              "focus-within:ring-neutral-400 focus-within:ring-offset-white",
            ].join(" "),
        isMd ? "size-4" : "size-3.5",
      ].join(" ")}
      data-state={stateValue}
    >
      <input
        aria-checked={indeterminate ? "mixed" : checked}
        aria-label={label}
        checked={checked}
        className="sr-only"
        onChange={onChange}
        ref={(el) => {
          if (el) {
            el.indeterminate = indeterminate ?? false;
          }
        }}
        type="checkbox"
      />
      {(checked || indeterminate) && (
        <span className="pointer-events-none grid place-content-center text-current transition-none">
          {indeterminate ? (
            <MinusIcon className={isMd ? "size-3" : "size-2.5"} weight="bold" />
          ) : (
            <CheckIcon className={isMd ? "size-3" : "size-2.5"} weight="bold" />
          )}
        </span>
      )}
    </label>
  );
};
