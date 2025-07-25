import { cn } from "~/lib/utils";

export const LoadingIndicator = () => {
  return (
    <div className="items-center justify-center flex text-3xl">
      <div className={cn("animate-bounce", "brand-500")}>.</div>
      <div
        className={cn("animate-bounce", "brand-500")}
        style={{ animationDelay: "0.1s" }}
      >
        .
      </div>
      <div
        className={cn("animate-bounce", "brand-500")}
        style={{ animationDelay: "0.2s" }}
      >
        .
      </div>
    </div>
  );
};
