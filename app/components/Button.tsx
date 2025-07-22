import { twMerge } from "tailwind-merge";
import Spinner from "./Spinner";
import type { ReactNode } from "react";

export const Button = ({
  type = "button",
  children,
  className,
  isLoading,
  isDisabled,
  ...props
}: {
  type?: "submit" | "button";
  isDisabled?: boolean;
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
      className={twMerge(
        "bg-brand-500 text-clear mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6",
        "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:border-none",
        className
      )}
    >
      {!isLoading && (children || "Agregar")}
      {isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
    </button>
  );
};
