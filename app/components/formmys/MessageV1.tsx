import { twMerge } from "tailwind-merge";
import { EmojiConfetti } from "../EmojiConffeti";
import type { ConfigSchema } from "~/utils/zod";
import { cn } from "~/lib/utils";
export { type MessageSchema, messageSchema } from "~/utils/zod"; // in order to import along with the component

export default function Message({
  className,
  showConfetti = false,
  size = "sm",
  config,
  type,
}: {
  type?: "subscription" | "contact";
  className?: string;
  showConfetti?: boolean;
  config: ConfigSchema;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}) {
  return (
    <article
      className={cn(
        "mx-auto w-full h-fit px-4 box-border flex items-center justify-center flex-col gap-4",
        size === "sm" ? "max-w-sm" : null,
        config.theme,
        {
          "flex-row": type === "subscription",
        },
        className
      )}
    >
      {config.icon && <img className="w-24" src={config.icon} alt="icon" />}
      <p className="text-center text-sm dark:text-white whitespace-pre-line">
        {config.message}
      </p>
      {config.confetti === "emoji" && showConfetti && (
        <EmojiConfetti mode="emojis" />
      )}
      {config.confetti === "paper" && showConfetti && <EmojiConfetti />}
    </article>
  );
}
