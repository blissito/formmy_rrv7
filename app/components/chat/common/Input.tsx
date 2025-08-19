import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const Input = ({
  placeholder,
  left = null,
  className,
  inputClassName,
  label,
  onChange,
  containerClassName,
  type,
  value,
  ...props
}: {
  type?: "text" | "search" | "textarea";
  containerClassName?: string;
  onChange?: (value: string) => void;
  label?: ReactNode;
  inputClassName?: string;
  className?: string;
  left?: ReactNode;
  placeholder?: string;
  value?: string;
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
      {label && <p className="text-metal font-light text-sm ">{label}</p>}
      <main
        className={cn(
          "flex items-stretch border border-outlines rounded-xl",
          containerClassName
        )}
      >
        {left && <div className="pl-3">{left}</div>}
        <TextField
          onChange={(ev) => onChange?.(ev.currentTarget.value)}
          placeholder={placeholder}
          value={value}
          className={cn(
            "placeholder:text-lightgray text-dark",
            "border-none focus:outline-none py-3 focus:border-none  focus:ring-brand-500 w-full min-h-full",
            {
              "rounded-r-xl": !!left,
              "rounded-xl": !left,
              "rounded-l-xl ": type === "textarea",
            },
            inputClassName
          )}
          type={type === "textarea" ? undefined : type}
          rows={type === "textarea" ? 8 : undefined}
          {...props}
        />
      </main>
    </section>
  );
};
