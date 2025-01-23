import type { ReactNode } from "react";
import { GradientButton } from "./ui/GradientButton";
import { cn } from "~/lib/utils";
import { Link } from "react-router";

export const BigCTA = ({
  onClick,
  className,
  containerClassName,
  children,
  value,
  type,
  ...props
}: {
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  containerClassName?: string;
  value?: string;
}) => {
  return (
    <GradientButton
      className={cn(
        (className =
          "group bg-brand-500 dark:bg-dark dark:hover:bg-[#1D1E27] transition-all text-clear  dark:text-white border-neutral-200 dark:border-white/10"),
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
