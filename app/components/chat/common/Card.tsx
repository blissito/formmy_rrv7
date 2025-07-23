import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { SearchInput } from "./SearchInput";
// import { SearchInput } from "./SearchInput";

export const Card = ({
  title,
  text,
  children,
  className,
  noSearch = true,
}: {
  noSearch?: true;
  className?: string;
  children?: ReactNode;
  title?: string;
  text?: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <article
      className={cn(
        "flex flex-col bg-[#fff] p-6 rounded-2xl shadow-lg border",
        className
      )}
    >
      <nav className="flex justify-between gap-3 items-baseline">
        <h3 className="text-2xl font-medium min-w-max mb-4">{title}</h3>
        {!noSearch && <SearchInput />}
      </nav>
      <p className="text-gray-500 mb-6 text-xs">{text}</p>
      <section>{children}</section>
    </article>
  );
};
