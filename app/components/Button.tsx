import { twMerge } from "tailwind-merge";
import Spinner from "./Spinner";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const Button = ({
  type = "button",
  children,
  variant,
  className,
  isLoading,
  isDisabled,
  ...props
}: {
  type?: "submit" | "button";
  isDisabled?: boolean;
  variant?:string;
  isLoading?: boolean;
  className?: string;
  children?: ReactNode;
  [x: string]: any; // any other props
}) => {
  return (
    <button
      {...props}
      disabled={isDisabled || isLoading}
      type={type}
      className={cn(
        "bg-brand-500 text-clear mt-6 block mx-auto cursor-pointer rounded-full h-12 px-6 grid place-content-center",
        { "bg-perl text-metal hover:bg-[#E1E3E7] mt-0 mx-0" : variant === "secondary"},
        { "bg-transparent text-dark hover:bg-[#E1E3E7] mt-0 mx-0" : variant === "ghost"},
        className,
        "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:border-none"
      )}
    >
      {!isLoading && (children || "Agregar")}
      {isLoading && (
        <div className="flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </button>
  );
};
