import { getUserOrRedirect } from "server/getUserUtils.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { useState } from "react";
import { Conversations } from "~/components/chat/tab_sections/Conversations";
import { Entrenamiento } from "~/components/chat/tab_sections/Entrenamiento";
import { Codigo } from "~/components/chat/tab_sections/Codigo";
import { Configuracion } from "~/components/chat/tab_sections/Configuracion";
import { db } from "../utils/db.server";
import type { Route } from "./+types/dashboard.chat_.$chatbotSlug";
import type { Chatbot, User } from "@prisma/client";

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
  const [currentTab, setCurrentTab] = useState("Preview"); // @TOOD: Update with the right one

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <PageContainer>
      <PageContainer.Title className="mb-2" back="/dashboard/chat">
        {chatbot.name}
      </PageContainer.Title>
      <PageContainer.TabSelector
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
      <div className="mt-6">
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
