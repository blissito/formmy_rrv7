import type { ReactNode } from "react";
import { GradientButton } from "./ui/GradientButton";
import { cn } from "~/lib/utils";

export const BigCTA = ({
  onClick,
  isLoading,
  className,
  containerClassName,
  children,
  value,
  type,
  ...props
}: {
  isLoading?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  containerClassName?: string;
  value?: string;
}) => {
  return (
    <GradientButton
      isLoading={isLoading}
      className={cn(
        (className =
          "group bg-brand-500  dark:hover:scale-95 transition-all text-clear  dark:text-white border-neutral-200 dark:border-white/10"),
        containerClassName
      )}
      value={value}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children ?? (
        <p className="text-base">
          Comenzar gratis <span className="group-hover:rotate-45"> &rarr;</span>
        </p>
      )}
    </GradientButton>
  );
};
