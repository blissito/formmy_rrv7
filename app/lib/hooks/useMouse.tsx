import { animate, useTransform, useMotionValue } from "framer-motion";
import { type RefObject, useEffect, useMemo } from "react";

export function useRotation(ref: RefObject<HTMLDivElement>) {
  const x = useMotionValue(
    typeof window !== "undefined" ? window.innerWidth / 2 : 0
  );
  const y = useMotionValue(
    typeof window !== "undefined" ? window.innerHeight / 2 : 0
  );

  useEffect(() => {
    // mouse move handler
    const handler = (e: MouseEvent) => {
      animate(x, e.clientX);
      animate(y, e.clientY);
    };
    addEventListener("mousemove", handler);
    return () => removeEventListener("mousemove", handler);
    /* eslint-disable */
  }, []);

  const dampen = 40;

  const rotateX = useTransform<number, number>(y, (newMouseY) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    const newRotateX = newMouseY - rect.top - rect.height / 2;
    return -newRotateX / dampen;
  });

  const rotateY = useTransform<number, number>(x, (newMouseX) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    const newRotateY = newMouseX - rect.left - rect.width / 2;
    return newRotateY / dampen;
  });

  // sheen
  const diagonalMovement = useTransform<number, number>(
    [rotateX, rotateY],
    ([newRotateX, newRotateY]) => newRotateX + newRotateY
  );
  const sheenPosition = useTransform(diagonalMovement, [-5, 5], [-100, 200]);
  const sheenOpacity = useTransform(
    sheenPosition,
    [-250, 50, 250],
    [0, 0.05, 0]
  );

  const sheenGradient = useMemo(() => {
    return `linear-gradient(
                55deg,
                transparent,
                rgba(255,255,255 / ${sheenOpacity}) ${sheenPosition}%,
                transparent)
      )`;
  }, [sheenOpacity, sheenPosition]);

  return { rotateX, rotateY, sheenGradient };
}
