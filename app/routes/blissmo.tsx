import { useLoaderData } from "react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";

type Position = { width: number; height: number; x: number; y: number };
type Point = { x: number; y: number };
type Color = {
  color: string;
  id: string;
};

// utils
const shuffle = (a: Color[]) => {
  const array = [...a];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const arrayMove = <T,>(a: T[], oldIndex: number, newIndex: number): T[] => {
  const array = [...a];
  if (newIndex >= array.length) return array;
  const old = array.splice(oldIndex, 1)[0];
  array.splice(newIndex, 0, old);
  return array;
};

// A clasic collider detector 🥰
function isColliding(source: Position, sample: Position, threshold = 0.5) {
  return (
    source.x < sample.x + sample.width - threshold * sample.width &&
    source.x + source.width > sample.x + threshold * sample.width &&
    source.y < sample.y + sample.height - threshold * sample.height &&
    source.y + source.height > sample.y + threshold * sample.height
  );
}
//

export const loader = () => {
  return {
    initialColors: [...Array(72).keys()].map((index) => ({
      color: `hsl(${360 * (index * 0.01)}, 50%, 50%)`,
      id: index + 1,
    })),
  };
};

export default function Page() {
  const { initialColors } = useLoaderData<typeof loader>();
  const [colors, setColors] = useState<Color[]>(initialColors);
  const [showInts, setShowInts] = useState(true);
  const positions = useRef<Position[]>([]);

  const saveItemPosition = (index: number, position: Position) => {
    positions.current[index] = position;
  };

  const swapColors = (fromIndex: number, toIndex: number) =>
    setColors(arrayMove<Color>(colors, fromIndex, toIndex));

  const moveItem = (fromIndex: number, point: Point) => {
    for (let i = 0; i < positions.current.length; i++) {
      const targetPosition = positions.current[i];
      if (
        !isColliding(
          { ...positions.current[fromIndex], ...point },
          targetPosition
        )
      ) {
        continue;
      }
      if (fromIndex === i) return;

      swapColors(fromIndex, i);
    }
  };

  return (
    <article className="flex flex-col items-center gap-4 justify-center h-screen bg-neutral-900">
      <h2 className="text-white text-4xl font-bold">Color grid by blissmo</h2>
      <div className="flex gap-4">
        <button
          onClick={() => setColors(initialColors)}
          className="px-6 py-3 rounded-xl text-black active:scale-95"
          style={{ background: "#fff" }}
        >
          Reset
        </button>
        <button
          onClick={() => setColors(shuffle(initialColors))}
          className="px-6 py-3 rounded-xl text-white active:scale-95"
          style={{ background: "#000" }}
        >
          Shuffle
        </button>
        <button
          onClick={() => setShowInts((i) => !i)}
          className="px-6 py-3 rounded-xl text-white active:scale-95 bg-blue-600"
        >
          {showInts ? "Clear" : "Show"} numbers
        </button>
      </div>
      <section className="grid grid-cols-12 gap-2">
        {/* <section className="flex flex-wrap gap-2 max-w-lg"> */}
        {colors.map((i, index) => (
          <Item
            id={showInts ? i.id : undefined}
            savePosition={saveItemPosition}
            moveItem={moveItem}
            index={index}
            color={i.color}
            key={i.color}
          />
        ))}
      </section>
    </article>
  );
}

export const Item = ({
  moveItem,
  index,
  color,
  savePosition,
  id,
}: {
  index: number;
  savePosition: (arg0: number, arg1: Position) => void;
  color: string;
  moveItem: (arg0: number, arg1: Point) => void;
  id?: string;
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    invariant(ref.current);
    const bounds = ref.current.getBoundingClientRect();
    savePosition(index, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.button
      children={id}
      className="bg-indigo-200 rounded h-12 w-12 cursor-grab active:cursor-grabbing hover:border-2 relative"
      layout
      ref={ref}
      drag
      dragSnapToOrigin
      style={{ backgroundColor: color }}
      transition={{ type: "spring" }}
      onDrag={(_, { point }) => {
        moveItem(index, point);
      }}
      tabIndex={0}
      whileHover={{
        zIndex: 10,
        scale: 1.1,
        boxShadow: "0px 3px 3px rgba(0,0,0,0.15)",
      }}
    />
  );
};
