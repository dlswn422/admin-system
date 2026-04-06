"use client";

import { Fragment, ReactNode } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type AppSelectSize = "sm" | "md" | "lg";

type AppSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  size?: AppSelectSize;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const sizeMap: Record<
  AppSelectSize,
  {
    button: string;
    iconLeft: string;
    option: string;
  }
> = {
  sm: {
    button:
      "h-10 rounded-xl text-xs font-bold px-3 pr-10",
    iconLeft: "left-3.5",
    option: "min-h-10 rounded-lg px-3 py-2 text-xs",
  },
  md: {
    button:
      "h-12 rounded-2xl text-sm font-semibold px-4 pr-11",
    iconLeft: "left-4",
    option: "min-h-11 rounded-xl px-3.5 py-2.5 text-sm",
  },
  lg: {
    button:
      "h-14 rounded-[20px] text-sm font-semibold px-4 pr-11",
    iconLeft: "left-5",
    option: "min-h-12 rounded-xl px-4 py-3 text-sm",
  },
};

export default function AppSelect({
  value,
  onChange,
  options,
  placeholder = "선택",
  size = "lg",
  icon,
  disabled = false,
  className,
}: AppSelectProps) {
  const selectedOption = options.find((option) => option.value === value);
  const styles = sizeMap[size];

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className={cx("relative w-full", className)}>
          <ListboxButton
            className={cx(
              "relative flex w-full items-center text-left text-slate-900 outline-none transition-all duration-200",
              "border border-slate-200/80 bg-slate-50/80 shadow-[0_6px_18px_rgba(15,23,42,0.04)]",
              "hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
              styles.button,
              icon ? "pl-12" : "",
              open && "border-blue-300 bg-white ring-4 ring-blue-500/10"
            )}
          >
            {icon ? (
              <span
                className={cx(
                  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-300",
                  styles.iconLeft
                )}
              >
                {icon}
              </span>
            ) : null}

            <span className="block min-w-0 flex-1 truncate">
              {selectedOption?.label ?? placeholder}
            </span>

            <ChevronDown
              className={cx(
                "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </ListboxButton>

          <ListboxOptions
            anchor="bottom start"
            transition
            className={cx(
              "z-[120] mt-2 max-h-72 w-[var(--button-width)] overflow-auto rounded-2xl border border-slate-200/90 bg-white/98 p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)] outline-none backdrop-blur-xl",
              "transition duration-150 ease-out [--anchor-gap:8px]",
              "data-[closed]:scale-95 data-[closed]:opacity-0"
            )}
          >
            {options.map((option) => (
              <ListboxOption key={option.value} value={option.value} as={Fragment} disabled={option.disabled}>
                {({ focus, selected, disabled: optionDisabled }) => (
                  <li
                    className={cx(
                      "relative flex cursor-pointer items-center gap-3 text-slate-700 transition-all",
                      styles.option,
                      focus && "bg-blue-50 text-blue-700",
                      selected && "bg-slate-900 text-white shadow-sm",
                      optionDisabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span className="block min-w-0 flex-1 truncate font-medium">
                      {option.label}
                    </span>

                    {selected ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : null}
                  </li>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      )}
    </Listbox>
  );
}