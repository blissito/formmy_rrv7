import { type ReactNode, createRef, forwardRef, type RefObject } from "react";
import { motion } from "framer-motion";
import { useRotation } from "~/lib/hooks/useMouse";

export default function MovingCard() {
  const ref = createRef<HTMLDivElement>();
  const { rotateX, rotateY, sheenGradient } = useRotation(ref);

  return (
    <Container style={{ rotateX, rotateY }}>
      <DotGrid />
      <Card ref={ref} sheenGradient={sheenGradient} />
    </Container>
  );
}

type CardProps = { sheenGradient?: string };
export const Card = forwardRef(function Card(
  { sheenGradient }: CardProps,
  ref
) {
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="rounded-md border border-gray-600"
      style={{
        backdropFilter: "blur(3px) brightness(120%)", // glass effect
        backgroundImage: sheenGradient, // reflection
      }}
    >
      <div className="w-40 h-20 rounded-md py-4 px-8 flex justify-center items-center text-center text-gray-50 shadow-md z-10">
        <span>Blissmo</span>
      </div>
    </div>
  );
});

export const Container = ({
  style,
  children,
}: {
  style: Record<string, string | number>;
  children: ReactNode;
}) => {
  return (
    <div
      style={{ perspective: "800px", transformStyle: "preserve-3d" }}
      className="overflow-hidden h-full"
    >
      <motion.div
        className="relative w-full h-full  flex items-center justify-center "
        style={{
          perspective: "800px",
          transformStyle: "preserve-3d",
          ...style,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export const DotGrid = () => {
  return (
    <div
      className="absolute w-full h-full"
      style={{
        transform: "translateZ(-500px)",
        backgroundSize: "60px 60px",
        backgroundPosition: "center",
        backgroundImage: `radial-gradient(
      circle at 1px 1px,
      white 2px,
      transparent 0
    )`,
      }}
    />
  );
};
