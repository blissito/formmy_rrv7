import { PageContainer } from "~/components/chat/PageContainer";
import { ConfigMenu } from "~/components/chat/ConfigMenu";
import { InfoSources } from "~/components/chat/InfoSources";
import { UploadFiles } from "~/components/chat/UploadFiles";
import { useState } from "react";
import { Website } from "~/components/chat/Website";
import type { WebsiteEntry } from "~/types/website";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import type { Route } from "./+types/chat_.nuevo";
import { getUserOrRedirect } from "server/getUserUtils.server";

export default function ChatbotConfigRoute({
  loaderData,
}: Route.ComponentProps) {
  const { user } = loaderData;
  const [currentTab, setCurrentTab] = useState("website");
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
      }

      // 3. Agregar archivos como contextos (si los hay)
      // TODO: Implementar subida de archivos

      // 4. Mostrar éxito y redirigir
      toast.success("¡Chatbot creado exitosamente!", { id: loadingToast });

      // Pequeño delay para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        navigate(`/chat/config/${chatbot.slug}`);
      }, 1000);
    } catch (error) {
      console.error("Error al crear chatbot:", error);
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
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
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
            <UploadFiles onChange={handleFilesChange} />
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
  return { user };
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
