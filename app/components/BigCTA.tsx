import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const BigCTA = ({
  onClick,
  isLoading,
  className,
  textClassName,
  containerClassName,
  children,
  value,
  type,
  name,
  ...props
}: {
  isLoading?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  textClassName?: string;
  containerClassName?: string;
  children?: ReactNode;
  value?: string;
  name?: string;
}) => {
  return (
    <button
      type={type || "button"}
      value={value}
      name={name}
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "group bg-brand-500 hover:bg-brand-600 transition-all hover:-translate-y-2  rounded-full px-4 py-3  h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
        containerClassName,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children ?? (
          <p className={cn("text-base heading text-dark", textClassName)}>
            Comenzar gratis 
          </p>
        )
      )}
    </button>
  );
};
