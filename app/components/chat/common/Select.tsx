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
      <span className="text-metal text-sm font-normal">{label}</span>
      <select
        className={cn(
          "rounded-xl border-gray-300 min-w-[220px] h-10 font-normal text-sm text-dark focus:ring-brand-500 focus:border-none",
          {
            "bg-transparent border-none text-metal": mode === "ghost",
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
