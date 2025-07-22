import { useLoaderData } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getChatbotBySlug } from "server/chatbot/chatbotModel.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { useState } from "react";
import type { Route } from "./+types/chat_.$chatbotSlug";
import { Toaster } from "react-hot-toast";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const { chatbotSlug } = params;

  if (!chatbotSlug) {
    throw new Response("Chatbot slug is required", { status: 400 });
  }

  const chatbot = await getChatbotBySlug(chatbotSlug);

  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  // Verificar que el chatbot pertenece al usuario
  if (chatbot.userId !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return { user, chatbot };
};

export default function ChatbotDetailRoute() {
  const { user, chatbot } = useLoaderData<typeof loader>();
  const [currentTab, setCurrentTab] = useState("Preview");

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <PageContainer>
      <PageContainer.Title back="/chat">{chatbot.name}</PageContainer.Title>
      <PageContainer.Header user={user} />
      <PageContainer.TabSelector
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
      <PageContainer.EditionPair
        chatbot={chatbot}
        user={user}
        currentTab={currentTab}
      />
    </PageContainer>
  );
}
