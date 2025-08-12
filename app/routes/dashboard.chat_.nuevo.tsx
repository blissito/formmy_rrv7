import { PageContainer } from "~/components/chat/PageContainer";
import { ConfigMenu } from "~/components/chat/ConfigMenu";
import { InfoSources } from "~/components/chat/InfoSources";
import { UploadFiles } from "~/components/chat/UploadFiles";
import { useState } from "react";
import { Website } from "~/components/chat/Website";
import type { WebsiteEntry } from "~/types/website";
import { useNavigate, redirect } from "react-router";
import toast from "react-hot-toast";
import type { Route } from "./+types/dashboard.chat_.nuevo";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { ListFiles } from "~/components/chat/ListFiles";
import { validateChatbotCreationAccess } from "server/chatbot/chatbotAccess.server";

export default function ChatbotConfigRoute(
  {
    // loaderData,
  }: Route.ComponentProps
) {
  // const { user } = loaderData;
  const [currentTab, setCurrentTab] = useState("files");
  const [websiteEntries, setWebsiteEntries] = useState<WebsiteEntry[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleTabClick = (tabName: string) => () => {
    setCurrentTab(tabName);
  };

  const handleCreateChatbot = async () => {
    if (websiteEntries.length === 0 && uploadedFiles.length === 0) {
      toast.error(
        "Agrega al menos un sitio web o archivo antes de crear el chatbot"
      );
      return;
    }

    setIsCreating(true);
    const loadingToast = toast.loading("Creando chatbot...");

    try {
      // 1. Crear el chatbot básico
      const createFormData = new FormData();
      createFormData.append("intent", "create_chatbot");
      createFormData.append("name", "Mi Chatbot");
      createFormData.append(
        "description",
        "Chatbot creado desde la interfaz web"
      );

      const createResponse = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: createFormData,
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Error al crear el chatbot");
      }

      const { chatbot } = await createResponse.json();
      const chatbotId = chatbot.id;

      // 2. Agregar sitios web como contextos
      for (const entry of websiteEntries) {
        const contextFormData = new FormData();
        contextFormData.append("intent", "add_url_context");
        contextFormData.append("chatbotId", chatbotId);
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
          throw new Error(`Error al agregar contexto para ${entry.url}: ${errorData.error}`);
        }
      }

      // 3. Agregar archivos como contextos (si los hay)
      for (const file of uploadedFiles) {
        try {
          const fileContextData = new FormData();
          fileContextData.append("intent", "add_file_context");
          fileContextData.append("chatbotId", chatbotId);
          fileContextData.append("fileName", file.name);
          fileContextData.append("fileType", file.type || "application/octet-stream");
          fileContextData.append("fileUrl", ""); // No hay URL para archivos locales
          fileContextData.append("sizeKB", Math.ceil(file.size / 1024).toString());
          fileContextData.append("file", file); // Enviar el archivo binario completo

          const fileResponse = await fetch("/api/v1/chatbot", {
            method: "POST",
            body: fileContextData,
          });

          if (!fileResponse.ok) {
            const errorData = await fileResponse.json();
            throw new Error(`Error al agregar archivo ${file.name}: ${errorData.error}`);
          }
        } catch (error) {
          throw error;
        }
      }

      // 4. Mostrar éxito y redirigir
      toast.success("¡Chatbot creado exitosamente!", { id: loadingToast });

      // Pequeño delay para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        navigate(`/dashboard/chat/${chatbot.slug}`);
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al crear el chatbot";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsCreating(false);
    }
  };

  const handleWebsiteChange = (entries: WebsiteEntry[]) => {
    setWebsiteEntries(entries);
  };
  const handleFilesChange = (newFiles: File[]) => {
    // Agregar nuevos archivos a los existentes, evitando duplicados por nombre
    setUploadedFiles(prevFiles => {
      const existingNames = new Set(prevFiles.map(file => file.name));
      const uniqueNewFiles = newFiles.filter(file => !existingNames.has(file.name));
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const handleRemoveFile = (index: number, file: File) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };
  return (
    <>
      <PageContainer>
        <PageContainer.Title back="/dashboard/chat">
          {"Nuevo Chatbot"}
        </PageContainer.Title>
        <PageContainer.StickyGrid>
          <ConfigMenu current="files">
            <ConfigMenu.MenuButton
              isActive={currentTab === "files"}
              onClick={handleTabClick("files")}
              src={"/assets/chat/document.svg"}
            >
              Archivos
            </ConfigMenu.MenuButton>
            <ConfigMenu.MenuButton
              isActive={currentTab === "website"}
              onClick={handleTabClick("website")}
              src={"/assets/chat/earth.svg"}
            >
              Website
            </ConfigMenu.MenuButton>
          </ConfigMenu>
          {currentTab === "files" && (
            <>
              <UploadFiles onChange={handleFilesChange} />
              {uploadedFiles.length > 0 && (
                <ListFiles 
                  files={uploadedFiles} 
                  onRemoveFile={handleRemoveFile}
                  mode="local"
                />
              )}
            </>
          )}
          {currentTab === "website" && (
            <Website
              websiteEntries={websiteEntries}
              onWebsiteEntriesChange={handleWebsiteChange}
            />
          )}
          <InfoSources
            className="hidden lg:block"
            websiteEntries={websiteEntries}
            uploadedFiles={uploadedFiles}
            onCreateChatbot={handleCreateChatbot}
            isCreating={isCreating}
          />
        </PageContainer.StickyGrid>
      </PageContainer>
    </>
  );
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  
  // Validate if user can create more chatbots
  const accessInfo = await validateChatbotCreationAccess(user.id);
  
  // If user can't create more chatbots, redirect to plans page
  if (!accessInfo.canCreate) {
    throw redirect("/dashboard/plan?reason=chatbot_limit");
  }
  
  return { user, accessInfo };
};

export const meta = ({ data }: { data: any }) => {
  if (!data?.chatbot) {
    return [
      { title: "Chatbot Not Found" },
      {
        name: "description",
        content: "The requested chatbot could not be found",
      },
    ];
  }

  return [
    { title: `Configure: ${data.chatbot.name}` },
    {
      name: "description",
      content: `Configure your chatbot: ${data.chatbot.name}`,
    },
  ];
};
