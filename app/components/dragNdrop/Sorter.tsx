import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { type ReactNode, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { BASIC_INPUTS } from "../formmys/FormyV1";
import ConfirmModal from "../ConfirmModal";

// {
//     combine: null;
//     destination: { droppableId: "the-drop-area"; index: 4 };
//     draggableId: "Select";
//     mode: "FLUID";
//     reason: "DROP";
//     source: { index: 2; droppableId: "the-drop-area" };
//     type: "DEFAULT";
//   }
export type DropEventType = {
  combine: null | any;
  destination: { droppableId: string; index: number } | null;
  draggableId: string;
  mode: "FLUID" | string;
  reason: "DROP" | string;
  source: { draggableId: string; index: number };
  type: "DEFAULT" | string;
};

export default function Sorter({
  names,
  onSort,
  children,
  className,
  onRemove,
  ...props
}: {
  children: ({
    name,
    index,
    isDraggingOver,
  }: {
    name: string;
    index: number;
    isDraggingOver: boolean;
  }) => ReactNode;
  names: string[];
  [x: string]: any;
  className?: string;
  onSort?: (order: string[]) => void;
  onRemove?: (name: string, index: number) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const drop = useRef<DropResult | null>(null);
  const onDragEnd = (ev: DropResult) => {
    if (!ev.destination) return handleRemove(ev);
    const order = Array.from(names);
    const [moved] = order.splice(ev.source.index, 1);
    order.splice(ev.destination?.index, 0, moved);
    onSort?.(order);
  };

  const handleRemove = (ev: DropResult) => {
    if (
      !BASIC_INPUTS.includes(names[ev.source.index]) // custom inputs only
    ) {
      setShowConfirm(true);
      drop.current = ev;
    }
  };

  const actualRemove = () => {
    if (!drop.current) return;
    setShowConfirm(false);
    onRemove?.(names[drop.current.source.index], drop.current.source.index);
  };

  return (
    <>
      <ConfirmModal
        onClick={actualRemove}
        onClose={() => setShowConfirm(false)}
        isOpen={showConfirm}
        title="¿Estás segur@ de eliminar este campo?"
        message={"Se eliminará el campo: " + drop.current?.draggableId}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="the-drop-area" direction="horizontal">
          {(prob, snap) => (
            <div
              {...props}
              {...prob.droppableProps}
              className={twMerge(
                "flex flex-wrap gap-2 overflow-hidden",
                className,
                snap.isDraggingOver &&
                  "bg-slate-100 dark:bg-slate-100/10 p-1 rounded-xl"
              )}
              ref={prob.innerRef}
            >
              {names.map((name, index) => (
                <div
                  key={name}
                  children={children({
                    name,
                    index,
                    isDraggingOver: snap.isDraggingOver,
                  })}
                />
              ))}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
