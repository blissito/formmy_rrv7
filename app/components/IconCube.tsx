import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { Palomita } from "~/routes/config.$projectId.basic";

export const IconCube = ({
  src,
  isSelected,
  onClick,
  children,
  className,
  action,
}: {
  action: ReactNode;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  isSelected?: boolean | null;
  src?: string;
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={twMerge(
        "group relative w-[200px]  bg-space-200 dark:bg-[#151516]",
        "min-w-12 w-12 h-12  rounded-md flex items-center justify-center",
        isSelected && "ring-2 ring-brand-500 relative",
        className
      )}
    >
      {isSelected && <Palomita className="top-1 right-1" />}
      {src && (
        <img onDragStart={(e) => e.preventDefault()} src={src} alt="icon" />
      )}
      {children && children}
      <div className="group-hover:visible invisible">{action}</div>
    </button>
  );
};
