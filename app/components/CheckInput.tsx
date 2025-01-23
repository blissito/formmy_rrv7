export const CheckInput = ({
  onChange,
  name,
  isDisabled,
  label,
  isChecked,
}: {
  isDisabled?: boolean;
  onChange: (arg0: string) => void;
  name: string;
  isChecked?: boolean;
  label?: string;
}) => {
  return (
    <label
      htmlFor={name}
      className="rounded border border-gray-100 py-1 px-2 text-xs text-gray-400 flex items-center justify-between w-32"
    >
      {label}
      <input
        disabled={isDisabled}
        name={name}
        onChange={() => onChange(name)}
        id={name}
        type="checkbox"
        checked={isChecked}
      />
    </label>
  );
};
