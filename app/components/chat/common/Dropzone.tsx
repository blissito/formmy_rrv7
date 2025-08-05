import { useDropFiles } from "~/hooks/useDropfiles";
import { cn } from "~/lib/utils";

export const Dropzone = ({ onDrop }: { onDrop?: (files: File[]) => void }) => {
  // hooks
  const { ref, isHovered } = useDropFiles<HTMLDivElement>({
    onDrop,
    accept: ".pdf,.docx,.xlsx,.csv,.txt",
  });

  return (
    <div
      ref={ref}
      className={cn(
        "group",
        "cursor-pointer",
        "bg-gray-50",
        "grid place-content-center place-items-center border-dashed border border-gray-300 rounded-3xl h-[200px] px-4",
        isHovered === "dropping" && "border-brand-500 bg-brand-500/20"
      )}
    >
      <span className="group-hover:scale-110 transition-all">
        <img src="/assets/chat/upload.svg" alt="upload icon" />
      </span>
      <h4 className="text-xs text-gray-500 font-medium text-center mt-2">
        Arrastra los archivos aquí o selecciona desde tu computadora
      </h4>
      <p className="text-xs text-gray-400 text-center mt-2">
        Puedes subir archivos .pdf, .docx, .xlsx, .csv o .txt
      </p>
    </div>
  );
};
