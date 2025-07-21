import { Card } from "./common/Card";
import { Dropzone } from "./common/Dropzone";

export const UploadFiles = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  return (
    <Card
      text={
        <span>
          La pestaña Archivos te permite cargar y administrar varios tipos de
          documentos para entrenar a tus agentes de IA.{" "}
          <a className="underline" href="!#">
            Más información
          </a>
        </span>
      }
      title="Sube tus archivos"
      className="py-4"
    >
      <Dropzone onDrop={onChange} />
    </Card>
  );
};
