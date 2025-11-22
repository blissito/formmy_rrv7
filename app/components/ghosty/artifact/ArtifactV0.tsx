import { cn } from "~/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import type { UIMessage } from "ai";

import { IoCloseCircleOutline } from "react-icons/io5";
import { useContext, type ReactNode } from "react";
import { ArtifactContext, useArtifact } from "~/hooks/useArtifact";
import { RiSplitCellsHorizontal } from "react-icons/ri";
import { FaRegHandPeace } from "react-icons/fa";
import { FaDiamondTurnRight } from "react-icons/fa6";

export const Artifact = ({ messages }: { messages: UIMessage[] }) => {
  const { showArtifact } = useArtifact({
    messages,
  });

  const { setShowArtifact } = useContext(ArtifactContext);

  return (
    <AnimatePresence>
      {showArtifact ? (
        <motion.article
          layout
          transition={{ type: "spring", bounce: 0 }}
          initial={{ width: "0%", x: "100vw" }}
          animate={{ width: "100%", x: 0 }}
          exit={{ width: "0%", x: "100vw" }}
          className={cn(
            "flex-2 w-full bg-gray-700 text-white r-rounded-4xl overflow-hidden",
            "border-l-4 border-l-gray-900",
            "relative"
          )}
        >
          <header className="p-4 bg-gray-900 flex gap-2">
            <button
              onClick={() => setShowArtifact(false)}
              className="text-3xl px-3 active:scale-95"
            >
              <IoCloseCircleOutline />
            </button>
            <h2 className="font-semibold text-xl">Esto es un artefacto</h2>
          </header>
          {/* This is absolute */}
          <ArtifactMenu />
          {/* This is absolute */}
        </motion.article>
      ) : null}
    </AnimatePresence>
  );
};

export const ArtifactMenu = () => {
  return (
    <section
      className={cn(
        "absolute bottom-12 right-12",
        "text-black",
        "gap-4",
        "flex flex-col"
      )}
    >
      <CircleButton>
        <FaRegHandPeace />
      </CircleButton>
      <CircleButton>
        <FaDiamondTurnRight />
      </CircleButton>
    </section>
  );
};

const CircleButton = ({ children }: { children: ReactNode }) => {
  return (
    <button
      className={cn(
        "active:scale-95",
        "text-xl",
        "p-4 rounded-full bg-white",
        "hover:bg-gray-100 transition-all"
      )}
    >
      {children}
    </button>
  );
};

export const ArtifactInline = () => {
  const { setShowArtifact } = useContext(ArtifactContext);
  return (
    <button
      onClick={() => setShowArtifact(true)}
      className={cn(
        "p-4 bg-gray-600 rounded-3xl",
        "text-white",
        "flex gap-3 items-center"
      )}
    >
      <h3>Artefacto</h3>
      <RiSplitCellsHorizontal />
    </button>
  );
};
