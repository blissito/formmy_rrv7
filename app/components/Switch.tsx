import { useState } from "react";
import { Switch } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

/**
 *
 * Brendi, por favot utiliza solo este componente: Toggle.
 * Es el más actualizado, si te hace falta algún prop, intenta agregarlo o díme,
 * y lo agregamos juntos. 🤓
 */

export const Toggle = ({
  className,
  isDisabled,
  onChange,
  defaultValue = false,
  value,
  name,
}: {
  className?: string;
  name?: string;
  isDisabled?: boolean;
  onChange?: (arg0: boolean) => void;
  defaultValue?: boolean;
  value?: boolean;
}) => {
  const [enabled, setEnabled] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : enabled;
  
  const handleChange = (newValue: boolean) => {
    if (!isControlled) {
      setEnabled(newValue);
    }
    onChange?.(newValue);
  };
  const isActive = isDisabled ? false : currentValue;
  return (
    <Switch
      checked={isActive}
      onChange={isDisabled ? undefined : handleChange}
      className={twMerge(
        `${
          isActive ? "bg-brand-500" : " dark:bg-[#22232A] bg-[#EFEFF0]"
        } relative inline-flex h-6 w-11 items-center rounded-full ${
          isDisabled ? "bg-gray-400 cursor-not-allowed" : ""
        }`,
        "min-w-[44px]",
        className ?? ""
      )}
    >
      <span className="sr-only">Enable notifications</span>
      <span
        className={`${
          isActive ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 transform rounded-full bg-clear transition`}
      />
      <input
        className="hidden"
        name={name || "unamed_switch"}
        type="checkbox"
        hidden
        checked={isActive}
        readOnly
      />
    </Switch>
  );
};

// @TODO: when need a checkbox please make it from Switch.
export function SimpleSwitch({
  defaultValue = false,
  isDisabled,
}: {
  isDisabled?: boolean;
  defaultValue?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultValue);

  return (
    <Switch
      disabled={isDisabled}
      checked={enabled}
      onChange={setEnabled}
      className={twMerge(
        `dark:bg-[#0D0E13] bg-space-200 relative inline-flex h-8 w-[52px] items-center rounded-full`,
        isDisabled && "bg-space-300 cursor-not-allowed",
        enabled && "bg-indigo-100"
      )}
    >
      <span
        className={twMerge(
          enabled ? "translate-x-6" : "translate-x-1",
          isDisabled && "bg-space-200",
          `inline-block h-6 w-6 transform rounded-full transition dark:bg-gray-400 bg-brand-500 `
        )}
      />
    </Switch>
  );
}

export default function ToggleButton({
  onChange,
  theme,
}: {
  theme: "dark" | "light";
  onChange?: (arg0: boolean) => void;
}) {
  return (
    <Switch
      checked={theme === "dark"}
      onChange={onChange}
      className={`dark:bg-hole bg-space-200 relative inline-flex h-8 w-[52px] items-center rounded-full`}
    >
      <span className="sr-only">Enable notifications</span>

      <span
        className={`dark:bg-[url('/assets/moons.svg')] dark:translate-x-6 translate-x-1 bg-cover bg-[url('/assets/sun.svg')] inline-block h-6 w-6 transform rounded-full  transition dark:bg-hole bg-space-200`}
      />
    </Switch>
  );
}
