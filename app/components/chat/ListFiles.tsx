import { Card } from "./common/Card";
import { FloatingMenu } from "../common/FloatingMenu";
import type { ReactNode } from "react";
import { Select } from "./common/Select";
import { cn } from "~/lib/utils";

export const ListFiles = () => {
  return (
    <Card title="Lista de archivos" noSearch={false}>
      <CardHeader
        left={
          <input
            className="rounded-md border-gray-300 scale-110"
            type="checkbox"
            onChange={() => {}}
          />
        }
        title="Seleccionar todos"
      />
      <section>
        <FileItem onSelect={() => {}} tag="Nuevo" />
        <FileItem type="docx" />
      </section>
    </Card>
  );
};

export const CardHeader = ({
  title,
  left,
}: {
  title: string;
  left?: ReactNode;
}) => {
  return (
    <header className="flex justify-between items-center mb-6">
      <label className="flex items-center gap-3">
        {left}
        <h4 className="text-gray-600 select-none text-lg ">{title}</h4>
      </label>
      <div className="flex items-center gap-2">
        <p className="text-gray-600"> Filtrar por:</p>
        <Select
          mode="ghost"
          className="min-w-min"
          options={[
            { label: "Todos", value: "all" },
            {
              label: "Estatus",
              value: "status",
            },
          ]}
        />
      </div>
    </header>
  );
};

const FileItem = ({
  type,
  tag,
  onSelect,
}: {
  type?: "docx";
  tag?: string;
  onSelect?: () => void;
}) => {
  const handleAction = (action: string) => {
    console.log(`Acción seleccionada: ${action}`);
    // Aquí puedes agregar la lógica para cada acción
  };

  const menuItems = [
    {
      label: "Descargar",
      onClick: () => handleAction("descargar"),
    },
    {
      label: "Renombrar",
      onClick: () => handleAction("renombrar"),
    },
    {
      label: "Eliminar",
      onClick: () => handleAction("eliminar"),
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  return (
    <div
      className={cn(
        "flex items-center gap-4 justify-between pr-2 border-t py-4 border-gray-300 relative",
        "hover:bg-gray-50"
      )}
    >
      <div className="flex items-center gap-4">
        <input
          className="rounded-md border-gray-300 scale-110"
          type="checkbox"
          onChange={onSelect}
        />
        <img
          className="w-16"
          src={
            type === "docx" ? "/assets/chat/doc.svg" : "/assets/chat/pdf.svg"
          }
          alt="document"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-medium">Servicios.pdf</p>
            {tag && <Tag text={tag} />}
          </div>
          <span className="text-md font-thin text-gray-500">60Kb</span>
        </div>
      </div>
      <FloatingMenu
        items={menuItems}
        buttonClassName="text-2xl text-gray-600 hover:bg-gray-100 p-1 rounded-full"
        buttonLabel="Opciones del archivo"
      />
    </div>
  );
};

const Tag = ({ text }: { text: string }) => {
  return (
    <span className="text-xs text-green-600 bg-green-100 rounded-full py-px px-2">
      {text}
    </span>
  );
};
