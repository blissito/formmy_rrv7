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
        <div className="fixed inset-0 flex items-center justify-center p-4 ">
          {/* The actual dialog panel  */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
          >
            <Dialog.Panel
              className={twMerge(
                size === "xs" && "max-w-[400px]",
                size === "md" && "max-w-[600px]",
                size === "lg" && "max-w-[800px]",
                "flex flex-col"
              )}
            >
              <Dialog.Title className="bg-clear dark:bg-space-900 flex justify-between items-center rounded-t-3xl ">
                <div className="text-2xl px-8 pt-8 pb-4 font-bold dark:text-white text-space-800">
                  {title}
                </div>
                <button onClick={onClose || (() => navigate(-1))}>
                  <img
                    alt="close"
                    src="/assets/close.svg"
                    className="dark:hidden block mr-4 mt-4"
                  />
                  <img
                    alt="close"
                    src="/assets/close-dark.svg"
                    className="dark:block hidden mr-4 mt-4"
                  />
                </button>
              </Dialog.Title>

              <section
                className={twMerge(
                  "min-w-[320px] h-min bg-clear dark:bg-space-900 rounded-b-3xl md:pt-0 px-12 ",
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