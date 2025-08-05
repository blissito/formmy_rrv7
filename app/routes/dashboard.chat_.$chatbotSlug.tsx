import { getUserOrRedirect } from "server/getUserUtils.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { Conversations } from "~/components/chat/tab_sections/Conversations";
import { Entrenamiento } from "~/components/chat/tab_sections/Entrenamiento";
import { Codigo } from "~/components/chat/tab_sections/Codigo";
import { Configuracion } from "~/components/chat/tab_sections/Configuracion";
import { useChipTabs } from "~/components/chat/common/ChipTabs";
import { db } from "../utils/db.server";
import type { Route } from "./+types/dashboard.chat_.$chatbotSlug";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const { chatbotSlug } = params;

  if (!chatbotSlug) {
    throw new Response("Chatbot slug is required", { status: 400 });
  }

  const chatbot = await db.chatbot.findUnique({
    where: {
      slug: chatbotSlug,
      userId: user.id,
    },
  });


  if (!chatbot) {
    throw new Response("Chatbot not found or you don't have access to it", {
      status: 404,
    });
  }

  // Verificar que el chatbot pertenece al usuario
  if (chatbot.userId !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const integrations = await db.integration.findMany({
    where: {
      chatbotId: chatbot.id,
    },
  });

  return { user, chatbot, integrations };
};

export default function ChatbotDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { user, chatbot, integrations } = loaderData;
  const { currentTab, setCurrentTab } = useChipTabs("Entrenamiento", `main_${chatbot.id}`);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <PageContainer>
      <PageContainer.Title className="!mb-2 md:!mb-4" back="/dashboard/chat">
        {chatbot.name}
      </PageContainer.Title>
      <PageContainer.TabSelector
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
      <div className="mt-0">
        {currentTab === "Preview" && (
          <PageContainer.EditionPair
            chatbot={chatbot}
            user={user}
            currentTab={currentTab}
          />
        )}
        {currentTab === "Conversaciones" && (
          <Conversations chatbot={chatbot} user={user} />
        )}
        {currentTab === "Entrenamiento" && (
          <Entrenamiento chatbot={chatbot} user={user} />
        )}
        {currentTab === "Tareas" && (
          <Tareas />
        )}
        {currentTab === "Código" && (
          <Codigo chatbot={chatbot} user={user} integrations={integrations} />
        )}
        {currentTab === "Configuración" && (
          <Configuracion chatbot={chatbot} user={user} />
        )}
      </div>
    </PageContainer>
  );
}


const Tareas = () => {
  return <section className="h-full min-h-[60vh] place-items-center grid">
    <div>
    <img className="w-[200px] mx-auto" src="/dash/comming.svg" alt="comming soon" />
    <h3 className="text-2xl font-bold text-dark text-center heading mt-6">Tareas Automatizadas en Camino</h3>
    <p className="paragraph text-center text-metal mt-3 max-w-md mx-auto">Estamos trabajando en una poderosa herramienta para que automatices tareas recurrentes y optimices la productividad de tu agente. ¡Muy pronto podrás programar acciones y flujos de trabajo personalizados!</p>
    </div>
  </section>;
};