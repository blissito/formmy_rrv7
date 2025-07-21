export const Select = ({
  label,
  options,
}: {
  label?: string;
  options: { value: string; label: string }[];
}) => {
  return (
    <div className="grid gap-1">
      <span className="text-gray-600">{label}</span>
      <select className="rounded-2xl border-gray-300 min-w-[220px] py-3">
        {options.map((option, i) => (
          <option key={i} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
