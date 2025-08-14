import type { ReactNode } from "react";
import { GradientButton } from "./ui/GradientButton";
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
    <GradientButton
      isLoading={isLoading}
      className={cn(
        (className =
          "group bg-brand-500 hover:bg-brand-600 transition-all transition-all text-clear  dark:text-white border-neutral-200 dark:border-white/10"),
        containerClassName
      )}
      value={value}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children ?? (
        <p className={cn("text-base heading ", textClassName)}>
          Comenzar gratis <span className="group-hover:rotate-45"> &rarr;</span>
        </p>
      )}
    </GradientButton>
  );
};
