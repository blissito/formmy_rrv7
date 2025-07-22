import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const Card = ({
  title,
  text,
  children,
  className,
}: {
  className?: string;
  children?: ReactNode;
  title?: string;
  text?: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <article
      className={cn(
        "flex flex-col bg-[#fff] p-4 rounded-2xl shadow-lg border",
        className
      )}
    >
      <h3 className="text-2xl font-medium">{title}</h3>
      <p className="text-gray-500 mb-6">{text}</p>
      <section>{children}</section>
    </article>
  );
};
