import { useState, useRef, useEffect } from "react";
import { cn } from "~/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  iconSrc?: string;
  disabled?: boolean;
  disabledReason?: string;
  bgColor?: string;
  badge?: string;
  recommended?: boolean;
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

// Función para obtener el color de fondo según el proveedor
const getProviderBg = (modelValue: string) => {
  if (modelValue.includes("anthropic") || modelValue.includes("claude")) {
    return "bg-gradient-to-br from-orange-50 to-red-50 border-l-2 border-orange-300";
  } else if (modelValue.includes("openai") || modelValue.includes("gpt")) {
    return "bg-gradient-to-br from-emerald-50 to-green-50 border-l-2 border-emerald-300";
  } else if (modelValue.includes("google") || modelValue.includes("gemini")) {
    return "bg-gradient-to-br from-blue-50 to-indigo-50 border-l-2 border-blue-300";
  } else if (modelValue.includes("meta") || modelValue.includes("llama")) {
    return "bg-gradient-to-br from-blue-50 to-gray-50 border-l-2 border-blue-400";
  } else if (modelValue.includes("mistralai")) {
    return "bg-gradient-to-br from-orange-50 to-red-50 border-l-2 border-orange-400";
  } else if (modelValue.includes("deepseek")) {
    return "bg-gradient-to-br from-sky-50 to-blue-50 border-l-2 border-sky-400";
  } else if (modelValue.includes("qwen")) {
    return "bg-gradient-to-br from-cyan-50 to-blue-50 border-l-2 border-cyan-400";
  } else if (modelValue.includes("moonshotai") || modelValue.includes("kimi")) {
    return "bg-gradient-to-br from-purple-50 to-blue-50 border-l-2 border-purple-400";
  }
  return "bg-gradient-to-br from-gray-50 to-purple-50 border-l-2 border-gray-300";
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
          "flex items-center gap-2 w-full px-4 h-12 text-base text-left border border-outlines rounded-xl bg-white focus:border-brand-500 focus:ring-transparent focus:outline-none",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          {selectedOption?.iconSrc && (
            <div className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm">
              <img
                src={selectedOption.iconSrc}
                alt={selectedOption.label}
                className="w-5 h-5 object-contain"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className=" text-base text-dark">
                {selectedOption ? selectedOption.label : placeholder}
              </p>
              {selectedOption?.badge && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {selectedOption.badge}
                </span>
              )}
            </div>
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
            "absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-auto",
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
                selectedValue === option.value && (option.bgColor || getProviderBg(option.value)),
                option.disabled && "opacity-50 cursor-not-allowed",
                optionClassName
              )}
            >
              {option.iconSrc && (
                <div className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm">
                  <img
                    src={option.iconSrc}
                    alt={option.label}
                    className="w-5 h-5 object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{option.label}</p>
                  {option.badge && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {option.badge}
                    </span>
                  )}
                </div>
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
