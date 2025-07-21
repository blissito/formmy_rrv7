import type { Route } from "./+types/chat-config";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getChatbotsByUserId } from "server/chatbot/chatbotModel.server";
import { effect } from "../utils/effect";

/**
 * Loader function for the chatbot config route without a chatbot ID
 * Redirects to the first chatbot's config page if available, otherwise to the chat list
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  return effect(
    async () => {
      const user = await getUserOrRedirect(request);

      // Get all chatbots for the user
      const chatbots = await getChatbotsByUserId(user.id);

      // If the user has chatbots, redirect to the first one's config page
      if (chatbots.length > 0) {
        return Response.redirect(`/chat/config/${chatbots[0].id}`);
      }

      // Otherwise, redirect to the chat list
      return Response.redirect("/chat");
    },
    (error) => {
      // In case of error, redirect to the chat list
      return Response.redirect("/chat");
    }
  );
};
