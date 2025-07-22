import type { ReactNode } from "react";
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
  type?: string;
  containerClassName?: string;
  onChange?: (value: string) => void;
  label?: ReactNode;
  className?: string;
  left?: ReactNode;
  placeholder?: string;

  [x: string]: unknown;
}) => {
  const TextField = type === "textarea" ? "textarea" : "input";
  return (
    <section className={cn("grid gap-1 grow", className)}>
      {label && <p className="text-gray-600">{label}</p>}
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
            "border-none focus:outline-none py-3 focus:border-none  w-full min-h-full",
            {
              "rounded-r-2xl": !!left,
              "rounded-full": !left,
              "rounded-2xl": type === "textarea",
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
