import { cn } from "~/lib/utils";

export const Select = ({
  label,
  defaultValue,
  options,
  value,
  onChange,
  className,
  mode,
  ...props
}: {
  className?: string;
  label?: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  mode?: "ghost";
  [x: string]: unknown;
}) => {
  return (
    <div className="grid gap-1">
      <span className="text-gray-600">{label}</span>
      <select
        className={cn(
          "rounded-2xl border-gray-300 min-w-[220px] py-3",
          {
            "bg-transparent border-none text-gray-600": mode === "ghost",
          },
          className
        )}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {options.map((option, i) => (
          <option key={i} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
