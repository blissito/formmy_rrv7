import { useLoaderData } from "react-router";
import type { Route } from "./+types/chat";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getUserChatbotsWithPlanInfo } from "server/chatbot/userModel.server";
import {
  createChatbot,
  getChatbotById,
  deleteChatbot,
} from "server/chatbot/chatbotModel.server";
import {
  activateChatbot,
  deactivateChatbot,
} from "server/chatbot/chatbotStateManager.server";
import { effect } from "../utils/effect";
import { PageContainer } from "~/components/chat/PageContainer";

/**
 * Loader function for the chat list route
 * Fetches all chatbots for the current user with plan information
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  // Get the current user or redirect to login
  const user = await getUserOrRedirect(request);
  // Get all chatbots for the user with plan information
  const chatbotsWithPlanInfo = await getUserChatbotsWithPlanInfo(user.id);
  return {
    user,
    plan: chatbotsWithPlanInfo.plan,
    limits: chatbotsWithPlanInfo.limits,
    chatbots: chatbotsWithPlanInfo.chatbots,
    canCreateMore: chatbotsWithPlanInfo.limits.canCreateMore,
  };
};

/**
 * Action function for the at li
ex Handles create, toggle status, and delete operations
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "create_chatbot": {
      const name = formData.get("name") as string;
      const description = (formData.get("description") as string) || undefined;

      return effect(
        async () => {
          const newChatbot = await createChatbot({
            name,
            description,
            userId: user.id,
          });

          return new Response(
            JSON.stringify({
              success: true,
              data: newChatbot,
              redirectTo: `/chat/config/${newChatbot.id}`,
            })
          );
        },
        (error) => {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Error creating chatbot",
            }),
            { status: 400 }
          );
        }
      );
    }

    case "toggle_status": {
      const chatbotId = formData.get("chatbotId") as string;
      const isActive = formData.get("isActive") === "true";

      return effect(
        async () => {
          // Verify ownership
          const chatbot = await getChatbotById(chatbotId);
          if (!chatbot || chatbot.userId !== user.id) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Chatbot not found or you don't have permission",
              }),
              { status: 404 }
            );
          }

          // Update status
          const updatedChatbot = isActive
            ? await activateChatbot(chatbotId)
            : await deactivateChatbot(chatbotId);

          return new Response(
            JSON.stringify({
              success: true,
              data: updatedChatbot,
            })
          );
        },
        (error) => {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Error updating chatbot status",
            }),
            { status: 500 }
          );
        }
      );
    }

    case "delete_chatbot": {
      const chatbotId = formData.get("chatbotId") as string;

      return effect(
        async () => {
          // Verify ownership
          const chatbot = await getChatbotById(chatbotId);
          if (!chatbot || chatbot.userId !== user.id) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Chatbot not found or you don't have permission",
              }),
              { status: 404 }
            );
          }

          // Delete chatbot
          await deleteChatbot(chatbotId);

          return new Response(
            JSON.stringify({
              success: true,
              message: "Chatbot deleted successfully",
            })
          );
        },
        (error) => {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || "Error deleting chatbot",
            }),
            { status: 500 }
          );
        }
      );
    }

    default:
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid intent",
        }),
        { status: 400 }
      );
  }
};

/**
 * Main component for the chat list routeProps
 * This is a placeholder that will be implemented in a future task
 */
export default function ChatListRoute({ loaderData }: Route.ComponentProps) {
  const {
    chatbots = [],
    plan,
    limits = { maxChatbots: 1 },
    canCreateMore,
    user,
  } = loaderData;
  return (
    <PageContainer>
      <PageContainer.Header user={user} />
      <PageContainer.Title
        cta={<PageContainer.Button>+ Chat</PageContainer.Button>}
      >
        Tus Chats IA
      </PageContainer.Title>
      <section className="my-10">
        <PageContainer.ChatCard chatbot={{ name: "perro" }} />
      </section>
    </PageContainer>
  );
}

export const meta = () => [
  { title: "My Chatbots" },
  { name: "description", content: "Manage your chatbots" },
];
