export const Select = ({
  label,
  options,
  value,
  onChange,
  ...props
}: {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  [x: string]: unknown;
}) => {
  return (
    <div className="grid gap-1">
      <span className="text-gray-600">{label}</span>
      <select
        className="rounded-2xl border-gray-300 min-w-[220px] py-3"
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
