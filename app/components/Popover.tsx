import { Popover as ThePopover } from "@headlessui/react";
import { useEffect, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export default function Popover({
  text,
  children,
  position = "bottom",
}: {
  position?: "right" | "bottom";
  text?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ThePopover className="relative inline-block">
      {({ close }) => {
        return (
          <>
            <Closer close={close} />
            <ThePopover.Button>{children}</ThePopover.Button>
            <ThePopover.Panel
              className={twMerge(
                "absolute z-10 min-w-max text-white rounded-xl p-2 bg-gray-600",
                position === "right" && "left-[110%] top-0"
              )}
            >
              {text} ✅
            </ThePopover.Panel>
          </>
        );
      }}
    </ThePopover>
  );
}
// @TODO: improve it (it just works once)
const Closer = ({
  close,
  duration = 3000,
  ...props
}: {
  duration?: number;
  close: () => void;
  [x: string]: any;
}) => {
  useEffect(() => {
    setTimeout(close, duration);
  }, [close, duration]);
  return <div {...props} />;
};
