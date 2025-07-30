import type { ReactNode } from "react";
import { FaSearch } from "react-icons/fa";
import { cn } from "~/lib/utils";

export const Input = ({
  placeholder,
  left = null,
  className,
  label,
  onChange,
  containerClassName,
  type,
  ...props
}: {
  type?: "text" | "search" | "textarea";
  containerClassName?: string;
  onChange?: (value: string) => void;
  label?: ReactNode;
  className?: string;
  left?: ReactNode;
  placeholder?: string;
  [x: string]: unknown;
}) => {
  // Icono de lupita
  if (type === "search") {
    left = (
      <span
        className={cn(
          "mr-3",
          "text-gray-500",
          "grid place-items-center h-full"
        )}
      >
        <img className="w-8" src="/assets/chat/search.svg" alt="search" />
      </span>
    );
  }
  const TextField = type === "textarea" ? "textarea" : "input";
  return (
    <section className={cn("grid gap-1 grow", className)}>
      {label && <p className="text-gray-600 text-sm mb-1">{label}</p>}
      <main
        className={cn(
          "flex items-stretch border rounded-2xl",
          containerClassName
        )}
      >
        {left && <div className="pl-3">{left}</div>}
        <TextField
          onChange={(ev) => onChange?.(ev.currentTarget.value)}
          placeholder={placeholder}
          className={cn(
            "placeholder:text-gray-400",
            "border-none focus:outline-none py-3 focus:border-none  focus:ring-brand-500 w-full min-h-full",
            {
              "rounded-r-2xl": !!left,
              "rounded-2xl": !left,
              "rounded-l-2xl": type === "textarea",
            }
          )}
          type={type === "textarea" ? undefined : type}
          rows={type === "textarea" ? 8 : undefined}
          {...props}
        />
      </main>
    </section>
  );
};
