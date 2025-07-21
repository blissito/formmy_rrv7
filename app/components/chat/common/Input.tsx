import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const Input = ({
  placeholder,
  left = null,
  className,
  label,
  onChange,
  ...props
}: {
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
  left?: ReactNode;
  placeholder?: string;

  [x: string]: unknown;
}) => {
  return (
    <section className={cn("grid gap-1 grow", className)}>
      {label && <p className="text-gray-600">{label}</p>}
      <main className="flex items-stretch border rounded-2xl">
        {left && <div className="pl-3">{left}</div>}
        <input
          onChange={(ev) => onChange?.(ev.currentTarget.value)}
          placeholder={placeholder}
          className={cn(
            "border-none focus:outline-none py-3 focus:border-none  w-full min-h-full",
            {
              "rounded-r-2xl": !!left,
              "rounded-full": !left,
            }
          )}
          {...props}
        />
      </main>
    </section>
  );
};
