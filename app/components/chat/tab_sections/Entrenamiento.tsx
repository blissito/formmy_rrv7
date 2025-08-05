import { useChipTabs } from "../common/ChipTabs";
import {
  ArchivosButton,
  ConfigMenu,
  TextButton,
  GoogleDriveButton,
  NotionButton,
  PreguntasButton,
  WebsiteButton,
} from "../ConfigMenu";
import { InfoSources } from "../InfoSources";
import { ListFiles } from "../ListFiles";
import { StickyGrid } from "../PageContainer";
import { UploadFiles } from "../UploadFiles";
import { TextForm } from "../TextForm";
import { Website } from "../Website";
import type { Chatbot, User } from "@prisma/client";
import { useEffect, useState } from "react";

export const Entrenamiento = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  const { currentTab, setCurrentTab } = useChipTabs("files");
  const [fileContexts, setFileContexts] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    // Extraer archivos del contexto del chatbot
    if (chatbot.contexts && Array.isArray(chatbot.contexts)) {
      const fileContextsFromDb = chatbot.contexts
        .filter((context: any) => context.type === "FILE" && context.fileName)
        .map((context: any) => ({
          id: context.id,
          fileName: context.fileName,
          fileType: context.fileType,
          sizeKB: context.sizeKB,
          content: context.content,
        }));
      setFileContexts(fileContextsFromDb);
    }
  }, [chatbot.contexts]);

  const handleFilesChange = (newFiles: File[]) => {
    // Agregar nuevos archivos a los existentes, evitando duplicados por nombre
    setUploadedFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map((file) => file.name));
      const uniqueNewFiles = newFiles.filter(
        (file) => !existingNames.has(file.name)
      );
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const handleRemoveUploadedFile = (index: number, file: File) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const handleUploadFiles = async () => {
    // Subir archivos nuevos al chatbot existente
    for (const file of uploadedFiles) {
      try {
        const fileContextData = new FormData();
        fileContextData.append("intent", "add_file_context");
        fileContextData.append("chatbotId", chatbot.id);
        fileContextData.append("fileName", file.name);
        fileContextData.append(
          "fileType",
          file.type || "application/octet-stream"
        );
        fileContextData.append("fileUrl", "");
        fileContextData.append(
          "sizeKB",
          Math.ceil(file.size / 1024).toString()
        );
        fileContextData.append("file", file);

        const response = await fetch("/api/v1/chatbot", {
          method: "POST",
          body: fileContextData,
        });

        if (response.ok) {
          console.log(`Archivo ${file.name} subido exitosamente`);
        } else {
          console.error(`Error subiendo archivo ${file.name}`);
        }
      } catch (error) {
        console.error(`Error procesando archivo ${file.name}:`, error);
      }
    }

    // Limpiar archivos subidos y recargar página para mostrar nuevos contextos
    setUploadedFiles([]);
    window.location.reload();
  };

  const handleRemoveContext = async (index: number, context: any) => {
    try {
      const formData = new FormData();
      formData.append("intent", "remove_context");
      formData.append("chatbotId", chatbot.id);
      formData.append("contextItemId", context.id);

      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Remover del estado local
        const newContexts = [...fileContexts];
        newContexts.splice(index, 1);
        setFileContexts(newContexts);
      } else {
        console.error("Error eliminando contexto");
      }
    } catch (error) {
      console.error("Error eliminando contexto:", error);
    }
  };

  const handleUpdateChatbot = async () => {
    // Subir archivos automáticamente cuando se presiona "Actualizar Chatbot"
    await handleUploadFiles();
  };

  return (
    <article>
      <StickyGrid>
        <section>
          <ConfigMenu current={currentTab}>
            <ArchivosButton
              onClick={() => setCurrentTab("files")}
              current={currentTab}
            />
            <TextButton
              onClick={() => setCurrentTab("text")}
              current={currentTab}
            />
            <WebsiteButton
              onClick={() => setCurrentTab("website")}
              current={currentTab}
            />
            <PreguntasButton
              onClick={() => setCurrentTab("preguntas")}
              current={currentTab}
            />
            <GoogleDriveButton
              onClick={() => setCurrentTab("google_drive")}
              current={currentTab}
            />
            <NotionButton
              onClick={() => setCurrentTab("notion")}
              current={currentTab}
            />
          </ConfigMenu>
        </section>
        {currentTab === "files" && (
          <section className="grid gap-6">
            <UploadFiles onChange={handleFilesChange} />

            {/* Mostrar archivos pendientes de subir */}
            {uploadedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Archivos pendientes de subir
                </h3>
                <ListFiles
                  files={uploadedFiles}
                  onRemoveFile={handleRemoveUploadedFile}
                  mode="local"
                />
              </div>
            )}

            {/* Mostrar contextos existentes */}
            {fileContexts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Archivos en el contexto
                </h3>
                <ListFiles
                  files={fileContexts}
                  onRemoveFile={handleRemoveContext}
                  mode="context"
                />
              </div>
            )}
          </section>
        )}
        {currentTab === "text" && <TextForm />}
        {currentTab === "website" && <Website />}

        <section className="hidden lg:block">
          <InfoSources
            contexts={fileContexts}
            uploadedFiles={uploadedFiles}
            mode="edit"
            onCreateChatbot={handleUpdateChatbot}
          />
        </section>
      </StickyGrid>
    </article>
  );
};
