import { useEffect, useState, type ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({
  onClose,
  children,
  title,
  size = "md",
  className,
}: {
  className?: string;
  onClose?: () => void;
  size?: "md" | "xs" | "lg";
  title?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <AnimatePresence>
      <Dialog
        open={show}
        onClose={onClose || (() => navigate(-1))}
        className={twMerge("relative z-[99] ")}
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur"
          aria-hidden="true"
        />

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4  w-full ">
          {/* The actual dialog panel  */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
          >
            <Dialog.Panel
              className={twMerge(
                size === "xs" ? "max-w-[400px]" : "",
                size === "md" ? "max-w-[98%] mx-auto md:min-w-[480px] md:max-w-[600px]" : "",
                size === "lg" ? "max-w-[800px]" : "",
                "flex flex-col overflow-hidden"
              )}
            >
              <Dialog.Title className="bg-clear pt-8 dark:bg-space-900 flex justify-between items-center rounded-t-3xl relative">
                <div className="text-xl md:text-2xl font-bold grow !text-center text-dark">
                  {title}
                </div>
                <button onClick={onClose || (() => navigate(-1))}>
                  <img
                    alt="close"
                    src="/assets/close.svg"
                    className="absolute right-4 md:right-8 top-4 md:top-8"
                  />
                </button>
              </Dialog.Title>

              <section
                className={twMerge(
                  "min-w-[320px] h-min bg-white rounded-b-3xl px-10 pb-4 md:pt-0 md:px-8 md:pb-8 box-border ",
                  className // this is here just for semantics
                )}
              >
                {children}
              </section>
            </Dialog.Panel>
          </motion.div>
        </div>
      </Dialog>
    </AnimatePresence>
  );
}
