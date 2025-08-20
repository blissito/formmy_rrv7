import { useState, useRef, useEffect } from "react";
import { BsThreeDots } from "react-icons/bs";
import { cn } from "~/lib/utils";

type MenuItem = {
  label: string;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
};

interface FloatingMenuProps {
  items: MenuItem[];
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  buttonClassName?: string;
  buttonLabel?: string;
}

export const FloatingMenu = ({
  items,
  icon = <BsThreeDots />,
  className = "",
  menuClassName = "",
  buttonClassName = "",
  buttonLabel = "Opciones",
}: FloatingMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative flex ${className}`} ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`text-2xl text-gray-600 hover:bg-irongray/10 p-1 rounded-full ${buttonClassName}`}
        aria-label={buttonLabel}
      >
        {icon}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-12 mt-2 w-max bg-[#fff] rounded-xl",
            "shadow-lg z-10 border border-gray-200",
            menuClassName
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "rounded-lg h-8",
                "w-full text-left px-4 py-1 text-xs",
                  "flex items-center gap-2",
                { "text-gray-700 hover:bg-gray-50": !item.className },
                item.className
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FloatingMenu;
