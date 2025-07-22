import { useDropFiles } from "~/hooks/useDropfiles";

export const Dropzone = ({ onDrop }: { onDrop?: (files: File[]) => void }) => {
  // hooks
  const { ref } = useDropFiles<HTMLDivElement>({
    onDrop,
  });

  return (
    <div
      ref={ref}
      className="grid place-content-center place-items-center border-dashed border-2 border-gray-300 rounded-3xl h-[200px] px-4"
    >
      <span>
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
