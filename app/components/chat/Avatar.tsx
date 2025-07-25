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
      style={{
        borderColor: primaryColor,
      }}
      className={cn(
        "border rounded-full border-gray-300 p-0",
        {
          "aspect-square": !!src,
          "w-6": !!src,
        },
        className
      )}
      src={src || "/assets/chat/ghosty.svg"}
      alt="avatar"
    />
  );
};
