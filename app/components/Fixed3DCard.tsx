import { type ReactNode, createRef, forwardRef, type RefObject } from "react";
import { motion } from "framer-motion";
import { useRotation } from "~/lib/hooks/useMouse";
import { twMerge } from "tailwind-merge";

export default function Fixed3DCard({
  rx,
  ry,
  isActive,
  img,
  className,
  style,
  translateZ,
}: {
  style?: Record<string, string>;
  className?: string;
  img?: string;
  isActive: boolean;
  rx: number;
  ry: number;
  translateZ?: string;
}) {
  const ref = createRef<HTMLDivElement>();
  const { sheenGradient } = useRotation(ref);

  return (
    <Container
      translateZ={translateZ}
      style={{ rotateX: rx, rotateY: ry }}
      isActive={isActive}
    >
      {/* <DotGrid /> */}
      <Card
        ref={ref}
        sheenGradient={sheenGradient}
        img={img}
        className={className}
      />
    </Container>
  );
}

type CardProps = { sheenGradient?: string; img?: string; className?: string };
export const Card = forwardRef(function Card(
  { sheenGradient, img, className }: CardProps,
  ref
) {
  return (
    <div
      className="w-full"
      ref={ref as RefObject<HTMLDivElement>}
      style={
        {
          // backdropFilter: "blur(3px) brightness(120%)", // glass effect
          // backgroundImage: sheenGradient, // reflection
        }
      }
    >
      <div className="">
        {img && (
          <img
            src={img}
            alt="cover"
            className={twMerge("object-cover", className)}
          />
        )}
      </div>
    </div>
  );
});

export const Container = ({
  style,
  className,
  translateZ = "-100px",
  children,
  isActive,
}: {
  className?: string;
  isActive?: boolean;
  style: Record<string, string | number>;
  children: ReactNode;
  translateZ?: string;
}) => {
  const styles = isActive
    ? { ...style, perspective: "5000px", transformStyle: "flat" }
    : // {}
      { perspective: "5000px", transformStyle: "flat" };
  return (
    <div
      style={{
        perspective: "800px",
        transformStyle: "flat",
        // transform: "translateZ(-500px)",
      }}
      className=""
    >
      <motion.div
        // whileHover={styles}
        animate={{
          ...styles,
          // translateY: translateZ ? 60 : 0,
          // translateZ: translateZ ? 100 : 0,
          translateZ: translateZ && isActive ? translateZ : "-200px",
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
