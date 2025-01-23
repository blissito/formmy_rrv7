import { AnimatePresence, motion } from "framer-motion";
import { FaCheck, FaRegCopy } from "react-icons/fa";

export const CopyOrCheckButton = ({ showCheck }: { showCheck: boolean }) => {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        initial={{ opacity: 0, filter: "blur(9px)", scale: 1.5 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        exit={{ opacity: 0, filter: "blur(9px)", scale: 1.5 }}
        key={showCheck ? "1" : "2"}
        className="grid place-content-center"
      >
        {showCheck ? <FaCheck /> : <FaRegCopy />}
      </motion.div>
    </AnimatePresence>
  );
};
