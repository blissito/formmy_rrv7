import {
  animate,
  useMotionValue,
  useTransform
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/lib/hooks/useMouse.tsx
var import_react = __toESM(require_react());
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/lib/hooks/useMouse.tsx"
  );
  import.meta.hot.lastModified = "1689027743578.5457";
}
function useRotation(ref) {
  const x = useMotionValue(
    typeof window !== "undefined" ? window.innerWidth / 2 : 0
  );
  const y = useMotionValue(
    typeof window !== "undefined" ? window.innerHeight / 2 : 0
  );
  (0, import_react.useEffect)(() => {
    const handler = (e) => {
      animate(x, e.clientX);
      animate(y, e.clientY);
    };
    addEventListener("mousemove", handler);
    return () => removeEventListener("mousemove", handler);
  }, []);
  const dampen = 40;
  const rotateX = useTransform(y, (newMouseY) => {
    if (!ref.current)
      return 0;
    const rect = ref.current.getBoundingClientRect();
    const newRotateX = newMouseY - rect.top - rect.height / 2;
    return -newRotateX / dampen;
  });
  const rotateY = useTransform(x, (newMouseX) => {
    if (!ref.current)
      return 0;
    const rect = ref.current.getBoundingClientRect();
    const newRotateY = newMouseX - rect.left - rect.width / 2;
    return newRotateY / dampen;
  });
  const diagonalMovement = useTransform(
    [rotateX, rotateY],
    ([newRotateX, newRotateY]) => newRotateX + newRotateY
  );
  const sheenPosition = useTransform(diagonalMovement, [-5, 5], [-100, 200]);
  const sheenOpacity = useTransform(
    sheenPosition,
    [-250, 50, 250],
    [0, 0.05, 0]
  );
  const sheenGradient = (0, import_react.useMemo)(() => {
    return `linear-gradient(
                55deg,
                transparent,
                rgba(255,255,255 / ${sheenOpacity}) ${sheenPosition}%,
                transparent)
      )`;
  }, [sheenOpacity, sheenPosition]);
  return { rotateX, rotateY, sheenGradient };
}

export {
  useRotation
};
//# sourceMappingURL=/build/_shared/chunk-7BZWNRXH.js.map
