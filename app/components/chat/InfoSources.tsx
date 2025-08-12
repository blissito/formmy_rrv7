import { cn } from "~/lib/utils";
import { Button } from "./PageContainer";
import type { WebsiteEntry } from "~/types/website";

export const InfoSources = ({
  className,
  websiteEntries = [],
  uploadedFiles = [],
  questions = [],
  contexts = [],
  textContexts = [],
  questionContexts = [],
  onCreateChatbot,
  isCreating = false,
  mode = "create", // "create" o "edit"
  hasPendingChanges = false,
}: {
  className?: string;
  websiteEntries?: WebsiteEntry[];
  questions?: string[];
  uploadedFiles?: File[];
  contexts?: any[];
  textContexts?: any[];
  questionContexts?: any[];
  onCreateChatbot?: () => void;
  isCreating?: boolean;
  mode?: "create" | "edit";
  hasPendingChanges?: boolean;
}) => {
  // Calcular el peso total de los sitios web (basado en el contenido de texto)
  const websiteWeight = websiteEntries.reduce((total, entry) => {
    // Estimar el peso del contenido en bytes (1 carácter ≈ 1 byte para texto)
    return total + (entry.content?.length || 0);
  }, 0);

  // Calcular el peso total de los archivos subidos
  const filesWeight = uploadedFiles.reduce((total, file) => {
    return total + file.size;
  }, 0);

  // Calcular el peso total de los contextos existentes (solo en modo edit)
  const contextsWeight =
    mode === "edit"
      ? contexts.reduce((total, context) => {
          return total + (context.sizeKB || 0) * 1024; // Convertir KB a bytes
        }, 0)
      : 0;

  // Calcular el peso total de los contextos de texto
  const textContextsWeight = textContexts.reduce((total, context) => {
    return total + (context.sizeKB || 0) * 1024; // Convertir KB a bytes
  }, 0);

  // Calcular el peso total de los contextos de preguntas
  const questionContextsWeight = questionContexts.reduce((total, context) => {
    return total + (context.sizeKB || 0) * 1024; // Convertir KB a bytes
  }, 0);

  const totalWeight = websiteWeight + filesWeight + contextsWeight + textContextsWeight + questionContextsWeight;
  const maxWeight = 1 * 1024 * 1024; // 800KB en bytes

  // Función para formatear bytes a KB/MB
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0KB";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  // Calcular total de páginas de sitios web
  const totalWebPages = websiteEntries.reduce((total, entry) => {
    return total + (entry.routes?.length || 0);
  }, 0);

  return (
    <article className={cn("min-w-full", className)}>
      <section className="grid gap-2 border border-outlines rounded-3xl p-4 shadow-standard md:min-w-[280px] min-w-full bg-white ">
        <div className="flex gap-2 items-center">
          <span className="w-4">
            <img src="/assets/chat/receipt.svg" alt="icon" />
          </span>
          <h4 className="text-lg md:text-base font-medium text-dark">Fuentes de información</h4>
        </div>

        {/* Mostrar archivos según el modo */}
        {mode === "create" && uploadedFiles.length > 0 && (
          <div className="flex gap-2 items-start text-sm">
            <span className="w-4">
              <img src="/assets/chat/document.svg" alt="icon" />
            </span>
            <p className="text-gray-600">
              {uploadedFiles.length} archivo
              {uploadedFiles.length !== 1 ? "s" : ""} (
              {formatBytes(filesWeight)})
            </p>
          </div>
        )}

        {mode === "edit" && contexts.length > 0 && (
          <div className="flex gap-2 items-start text-sm">
            <span className="w-4">
              <img src="/assets/chat/document.svg" alt="icon" />
            </span>
            <p className="text-gray-600">
              {contexts.length} archivo
              {contexts.length !== 1 ? "s" : ""} ({formatBytes(contextsWeight)})
            </p>
          </div>
        )}

        {websiteEntries.length > 0 && (
          <div className="flex gap-2 items-start text-sm">
            <span className="w-4">
              <img src="/assets/chat/earth.svg" alt="icon" />
            </span>
            <p className="text-gray-600">
              {websiteEntries.length} sitio
              {websiteEntries.length !== 1 ? "s" : ""} web
              {totalWebPages > 0 &&
                ` (${totalWebPages} página${totalWebPages !== 1 ? "s" : ""})`}
              {" "}({formatBytes(websiteWeight)})
            </p>
          </div>
        )}

        {textContexts.length > 0 && (
          <div className="flex gap-2 items-start text-sm">
            <span className="w-4">
              <img src="/assets/chat/increase.svg" alt="icon" />
            </span>
            <p className="text-gray-600">
              {textContexts.length} fuente{textContexts.length !== 1 ? "s" : ""} de texto ({formatBytes(textContextsWeight)})
            </p>
          </div>
        )}

        {questionContexts.length > 0 && (
          <div className="flex gap-2 items-center text-sm">
            <span className="w-4">
              <img src="/assets/chat/message.svg" alt="icon" />
            </span>
            <p className="text-gray-600">
              {questionContexts.length} grupo{questionContexts.length !== 1 ? "s" : ""} de preguntas ({formatBytes(questionContextsWeight)})
            </p>
          </div>
        )}

        <hr className="border-b border-dashed my-2 w-full" />

        <div className="flex justify-between">
          <p>Peso total:</p>
          <div className="grid text-sm">
            <span className={totalWeight > maxWeight ? "text-red-500" : ""}>
              {formatBytes(totalWeight)}
            </span>
            <span className="text-irongray">/ {formatBytes(maxWeight)} </span>
          </div>
        </div>

        {totalWeight > maxWeight && (
          <div className="text-red-500 text-xs">⚠️ Límite excedido</div>
        )}

        {mode === "create" && (
          <Button
            className="mt-6 "
            onClick={onCreateChatbot}
            isDisabled={
              totalWeight > maxWeight ||
              isCreating ||
              (websiteEntries.length === 0 && uploadedFiles.length === 0 && textContexts.length === 0 && questionContexts.length === 0)
            }
          >
            {isCreating ? "Creando..." : "Crear Chatbot"}
          </Button>
        )}

        {mode === "edit" && onCreateChatbot && (
          <Button
            className="mt-6 flex items-center justify-center "
            onClick={onCreateChatbot}
            isDisabled={
              totalWeight > maxWeight || 
              isCreating || 
              !hasPendingChanges
            }
          >
            {isCreating ? "Actualizando..." : !hasPendingChanges ? "Actualizar agente" : "Actualizar agente"}
          </Button>
        )}
      </section>
    </article>
  );
};
