export const UploadFiles = () => {
  return (
    <article className="grid bg-[#fff] p-4 rounded-2xl shadow-lg border">
      <h3 className="text-2xl font-medium">Sube tus archivos</h3>
      <p className="text-gray-500 mb-6">
        La pestaña Archivos te permite cargar y administrar varios tipos de
        documentos para entrenar a tus agentes de IA.{" "}
        <a className="underline" href="!#">
          Más información
        </a>
      </p>
      <div className="grid place-content-center place-items-center border-dashed border-2 border-gray-300 rounded-3xl h-[200px] px-4">
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
    </article>
  );
};
