import { cn } from "~/lib/utils";

export const Avatar = ({
  src,
  primaryColor = "brand-500",
  className,
}: {
  src?: string;
  primaryColor?: string;
  className?: string;
}) => {
  return (
    <img
      className={cn(
        "border rounded-full border-outlines object-cover",
        "w-10 h-10",
        className
      )}
      src={src || "/assets/chat/ghosty.svg"}
      alt="avatar"
    />
  );
};
