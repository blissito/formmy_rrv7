import { useState, useRef, useEffect } from "react";
import { BsThreeDots } from "react-icons/bs";

type MenuItem = {
  label: string;
  onClick: () => void;
  className?: string;
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
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`text-2xl text-gray-600 hover:bg-gray-100 p-1 rounded-full ${buttonClassName}`}
        aria-label={buttonLabel}
      >
        {icon}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 ${menuClassName}`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${item.className || 'text-gray-700 hover:bg-gray-100'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FloatingMenu;
