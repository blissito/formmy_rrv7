import { Link } from "react-router";
import type { Route } from "./+types/chat-config";
import { db } from "~/utils/db.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { ConfigMenu } from "~/components/chat/ConfigMenu";
import { InfoSources } from "~/components/chat/InfoSources";
/**
 * Main component for the chatbot config route
 * This is a placeholder that will be implemented in a future task
 */
export default function ChatbotConfigRoute({
  loaderData,
}: Route.ComponentProps) {
  const { chatbot } = loaderData;

  return (
    <>
      <PageContainer>
        <PageContainer.Title back="/chat">{chatbot.name}</PageContainer.Title>
        <PageContainer.StickyGrid>
          <ConfigMenu current="files" />
          <div className="bg-blue-300 h-[300vh]">Perro</div>
          <InfoSources />
        </PageContainer.StickyGrid>
      </PageContainer>
    </>
  );
}

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

/**
 * Loader function for the chatbot config route
 * Fetches the chatbot with the given ID if it belongs to the current user
 */
export const loader = async ({ params }: Route.LoaderArgs) => {
  const { chatbotSlug } = params;

  if (!chatbotSlug) {
    // If no chatbotId is provided, redirect to the chat list
    return Response.redirect("/chat");
  }

  const chatbot = await db.chatbot.findUnique({
    where: {
      slug: chatbotSlug,
    },
  });
  return { chatbot };
};
