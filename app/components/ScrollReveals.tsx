import { type ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";

export const ScrollReveal = ({ children }: { children: ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      style={{
        opacity: isInView ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) 0.2s",
        transform: isInView ? "translateY(0)" : "translateY(100px)",
      }}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};

export const ScrollRevealRight = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      style={{
        opacity: isInView ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) .8s",
        transform: isInView ? "translateX(0)" : "translateX(100px)",
      }}
      className={className}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};

export const ScrollRevealLeft = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      style={{
        opacity: isInView ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) .8s",
        transform: isInView ? "translateX(0)" : "translateX(-100px)",
      }}
      className={className}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};
