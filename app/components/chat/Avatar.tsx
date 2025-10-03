import { cn } from "~/lib/utils";

export const Avatar = ({
  src,
  primaryColor = "brand-500",
  className,
}: {
  src?: string | null;
  primaryColor?: string;
  className?: string;
}) => {
  const defaultImage = "/assets/chat/user-placeholder.svg";

  return (
    <img
      className={cn(
        "border rounded-full border-outlines object-cover",
        "w-10 h-10",
        className
      )}
      src={src || defaultImage}
      alt="avatar"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== defaultImage) {
          target.src = defaultImage;
        }
      }}
    />
  );
};
