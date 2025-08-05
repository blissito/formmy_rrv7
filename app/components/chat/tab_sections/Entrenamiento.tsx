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
import type { WebsiteEntry } from "~/types/website";
import { useEffect, useState } from "react";
import { useSubmit } from "react-router";

export const Entrenamiento = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  const submit = useSubmit();
  const { currentTab, setCurrentTab } = useChipTabs("website");
  const [fileContexts, setFileContexts] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingWebsites, setExistingWebsites] = useState<WebsiteEntry[]>([]);
  const [newWebsiteEntries, setNewWebsiteEntries] = useState<WebsiteEntry[]>(
    []
  );
  const [isUpdating, setIsUpdating] = useState(false);

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

      // Extraer sitios web del contexto del chatbot
      const websiteContextsFromDb = chatbot.contexts
        .filter((context: any) => context.type === "LINK" && context.url)
        .map((context: any) => ({
          url: context.url,
          content: context.content || "",
          routes: context.routes && context.routes.length > 0 ? context.routes : [context.url], // Usar rutas reales o fallback
          includeRoutes: undefined,
          excludeRoutes: undefined,
          updateFrequency: "monthly" as const,
          lastUpdated: new Date(context.createdAt),
          contextId: context.id, // Guardamos el ID para poder eliminar
        }));

      // Actualizar los sitios web existentes desde la base de datos
      setExistingWebsites(websiteContextsFromDb);
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

    // Limpiar archivos subidos y recargar datos
    setUploadedFiles([]);
    submit({});
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
    setIsUpdating(true);
    
    try {
      // Subir archivos automáticamente cuando se presiona "Actualizar Chatbot"
      await handleUploadFiles();

    // Agregar sitios web nuevos como contextos
    for (const entry of newWebsiteEntries) {
      try {
        const contextFormData = new FormData();
        contextFormData.append("intent", "add_url_context");
        contextFormData.append("chatbotId", chatbot.id);
        contextFormData.append(
          "url",
          entry.url.startsWith("http") ? entry.url : `https://${entry.url}`
        );
        contextFormData.append("title", entry.url);
        contextFormData.append("content", entry.content);
        contextFormData.append(
          "sizeKB",
          Math.ceil(entry.content.length / 1024).toString()
        );
        contextFormData.append("routes", JSON.stringify(entry.routes));

        const contextResponse = await fetch("/api/v1/chatbot", {
          method: "POST",
          body: contextFormData,
        });

        if (!contextResponse.ok) {
          const errorData = await contextResponse.json();
          console.error(
            `Error al agregar contexto para ${entry.url}:`,
            errorData.error
          );
        } else {
          console.log(`Contexto agregado exitosamente para ${entry.url}`);
        }
      } catch (error) {
        console.error(`Error procesando sitio web ${entry.url}:`, error);
      }
    }

      // Limpiar website entries nuevos después de subirlos y recargar datos
      if (newWebsiteEntries.length > 0) {
        setNewWebsiteEntries([]);
        submit({});
      }
    } catch (error) {
      console.error("Error updating chatbot:", error);
    } finally {
      setIsUpdating(false);
    }
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
        {currentTab === "website" && (
          <Website
            websiteEntries={[...existingWebsites, ...newWebsiteEntries]}
            onWebsiteEntriesChange={(entries) => {
              // Separar sitios existentes de nuevos
              const existing = entries.filter((entry) => entry.contextId);
              const newEntries = entries.filter((entry) => !entry.contextId);
              setExistingWebsites(existing);
              setNewWebsiteEntries(newEntries);
            }}
            chatbotId={chatbot.id}
          />
        )}

        <section className="hidden lg:block">
          <InfoSources
            contexts={fileContexts}
            uploadedFiles={uploadedFiles}
            websiteEntries={newWebsiteEntries}
            mode="edit"
            onCreateChatbot={handleUpdateChatbot}
            isCreating={isUpdating}
          />
        </section>
      </StickyGrid>
    </article>
  );
};
