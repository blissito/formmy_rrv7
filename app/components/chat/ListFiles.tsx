import { Card } from "./common/Card";
import { FloatingMenu } from "../common/FloatingMenu";
import type { ReactNode } from "react";
import { Select } from "./common/Select";
import { cn } from "~/lib/utils";
import DownloadIcon from "../ui/icons/Download";
import EditIcon from "../ui/icons/Edit";
import DeleteIcon from "../ui/icons/Delete";
import RenameIcon from "../ui/icons/Rename";

export const ListFiles = ({ 
  files = [], 
  onRemoveFile,
  mode = "local" // "local" para archivos del navegador, "context" para contextos del chatbot
}: { 
  files?: File[] | any[]; 
  onRemoveFile?: (index: number, file: any) => void;
  mode?: "local" | "context";
}) => {
  const getFileType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase() || '';
    switch (extension) {
      case "pdf":
        return "pdf";
      case "doc":
      case "docx":
        return "docx";
      case "xls":
      case "xlsx":
        return "xlsx";
      case "csv":
        return "csv";
      case "txt":
        return "txt";
      default:
        return "pdf";
    }
  };

  const getFileIcon = (type: string): string => {
    switch (type) {
      case "pdf":
        return "/assets/chat/pdf.svg";
      case "docx":
        return "/assets/chat/doc.svg";
      case "xlsx":
        return "/assets/chat/xlsx.svg";
      case "csv":
        return "/assets/chat/csv.svg";
      case "txt":
        return "/assets/chat/txt.svg";
      default:
        return "/assets/chat/pdf.svg";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card title="Lista de archivos" noSearch={false} navClassName="!mb-4">
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
        {files.length > 0 &&
          files.map((file, index) => (
            <FileItem
              key={index}
              type={getFileType(file.name || file.fileName)}
              icon={getFileIcon(getFileType(file.name || file.fileName))}
              fileName={file.name || file.fileName}
              fileSize={mode === "context" 
                ? `${file.sizeKB || 0} KB` 
                : formatFileSize(file.size)
              }
              onSelect={() => {}}
              onRemove={() => onRemoveFile?.(index, file)}
              tag={index === 0 ? "Nuevo" : undefined}
            />
          ))}
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
    <header className="flex justify-between items-center mb-2">
      <label className="flex items-center gap-3">
        {left}
        <h4 className="text-gray-600 select-none md:text-base text-sm ">{title}</h4>
      </label>
      <div className="flex items-center gap-2">
        <p className="text-gray-600 text-sm md:text-base"> Filtrar por:</p>
        <Select
          mode="ghost"
          className="min-w-min text-sm md:text-base"
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

export const FileItem = ({
  type,
  tag,
  onSelect,
  onRemove,
  icon,
  fileName = "Servicios.pdf",
  fileSize = "60Kb",
}: {
  type?: string;
  tag?: string;
  onSelect?: () => void;
  onRemove?: () => void;
  icon?: string;
  fileName?: string;
  fileSize?: string;
}) => {
  const handleAction = (action: string) => {
    console.log(`Acción seleccionada: ${action}`);
    if (action === "eliminar" && onRemove) {
      onRemove();
    }
    // Aquí puedes agregar la lógica para cada acción
  };

  const menuItems = [
    {
      label: "Descargar",
      onClick: () => handleAction("descargar"),
      icon:<DownloadIcon className="w-4 h-4" />,
    },
    {
      label: "Renombrar",
      onClick: () => handleAction("renombrar"),
      icon:<RenameIcon className="w-4 h-4" />,

    },
    {
      label: "Eliminar",
      onClick: () => handleAction("eliminar"),
      className: "text-danger hover:bg-red-50",
      icon:<DeleteIcon className="w-4 h-4" />,
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
          className="w-10"
          src={
            icon ||
            (type === "docx" ? "/assets/chat/doc.svg" : "/assets/chat/pdf.svg")
          }
          alt="document"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm md:text-base font-medium">{fileName}</p>
            {tag && <Tag  className="hidden md:block" text={tag} />}
          </div>
          <span className="text-sm font-thin text-gray-500">{fileSize}</span>
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

const Tag = ({ text, className }: { text: string; className?: string }) => {
  return (
    <span className={cn("text-xs text-green-600 bg-green-100 rounded-full py-px px-2", className) }>
      {text}
    </span>
  );
};

export const CardRow = ({
  type,
  tag,
  text,
  icon,
  onSelect,
  onRemove,
  onEdit,
  title,
  subtitle,
}: {
  type?: "docx";
  tag?: string;
  text?: string;
  icon?: ReactNode;
  onSelect?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  title: string;
  subtitle?: string;
}) => {
  const handleAction = (action: string) => {
    console.log(`Acción seleccionada: ${action}`);
    if (action === "eliminar" && onRemove) {
      onRemove();
    }
    if (action === "editar" && onEdit) {
      onEdit();
    }
    // Aquí puedes agregar la lógica para cada acción
  };

  const menuItems = [
    {
      label: "Descargar",
      onClick: () => handleAction("descargar"),
      icon: <DownloadIcon className="w-4 h-4" />,
    },
    {
      label: "Editar",
      onClick: () => handleAction("editar"),
      icon:<EditIcon className="w-4 h-4" />,
    },
    {
      label: "Eliminar",
      onClick: () => handleAction("eliminar"),
      className: "text-danger  hover:bg-red-50",
      icon:<DeleteIcon className="w-4 h-4" />,
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
        {icon ? (
          <span className="bg-gray-200 p-2 aspect-square rounded-full">
            {icon}
          </span>
        ) : (
          <img className="w-16" src={"/assets/chat/doc.svg"} alt="document" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-medium">{title}</p>
            {tag && <Tag text={tag} />}
          </div>
          {/* {subtitle && <p className="text-sm text-gray-600 mb-1">{subtitle}</p>} */}
          <p className="text-sm font-thin text-gray-500">{text}</p>
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
