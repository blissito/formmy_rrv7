import { useState, useRef, useEffect } from "react";
import { cn } from "~/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  iconSrc?: string;
  disabled?: boolean;
  disabledReason?: string;
};

type IconDropdownProps = {
  options: DropdownOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  showChevron?: boolean;
  label?: string;
};

export const IconDropdown = ({
  options,
  selectedValue,
  onChange,
  placeholder = "Seleccionar...",
  className,
  buttonClassName,
  dropdownClassName,
  optionClassName,
  showChevron = true,
  label,
}: IconDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar la opción seleccionada
  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm text-gray-600 mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-3 text-left border border-gray-300 rounded-lg bg-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          {selectedOption?.iconSrc && (
            <img
              src={selectedOption.iconSrc}
              alt={selectedOption.label}
              className="w-6 h-6 object-contain"
            />
          )}
          <div>
            <p className="font-medium text-sm">
              {selectedOption ? selectedOption.label : placeholder}
            </p>
            {selectedOption?.description && (
              <p className="text-xs text-gray-500">
                {selectedOption.description}
              </p>
            )}
          </div>
        </div>
        {showChevron && (
          <svg
            className={cn(
              "w-5 h-5 transition-transform",
              isOpen ? "transform rotate-180" : ""
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto",
            dropdownClassName
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              disabled={option.disabled}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50",
                "border-b border-gray-100 last:border-b-0",
                selectedValue === option.value && "bg-blue-50",
                option.disabled && "opacity-50 cursor-not-allowed",
                optionClassName
              )}
            >
              {option.iconSrc && (
                <img
                  src={option.iconSrc}
                  alt={option.label}
                  className="w-6 h-6 object-contain"
                />
              )}
              <div>
                <p className="font-medium text-sm">{option.label}</p>
                <div className="flex items-center gap-2">
                  {option.description && (
                    <p className="text-xs text-gray-500">
                      {option.description}
                    </p>
                  )}
                  {option.disabled && option.disabledReason && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {option.disabledReason}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
