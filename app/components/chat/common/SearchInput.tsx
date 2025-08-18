import { Input } from "./Input";
import { cn } from "~/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  isLoading?: boolean;
}

export const SearchInput = ({
  placeholder = "Buscar...",
  className,
  containerClassName,
  isLoading = false,
  ...props
}: SearchInputProps) => {
  return (
    <div className={cn("", containerClassName)}>
      <Input inputClassName="!max-h-10 !rounded-full" containerClassName="!rounded-full" type="search" placeholder={placeholder} {...(props as any)} />
      {isLoading && (
        <div className="absolute  right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-pulse rounded-full bg-gray-300"></div>
      )}
    </div>
  );
};
