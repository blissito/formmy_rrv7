import { useLoaderData, Link, useParams } from "react-router";
import type { Route } from "./+types/chat-config";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getChatbotById } from "server/chatbot/chatbotModel.server";
import { effect } from "../utils/effect";

/**
 * Loader function for the chatbot config route
 * Fetches the chatbot with the given ID if it belongs to the current user
 */
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const { chatbotId } = params;

  if (!chatbotId) {
    // If no chatbotId is provided, redirect to the chat list
    return Response.redirect("/chat");
  }

  return effect(
    async () => {
      // Get the chatbot
      const chatbot = await getChatbotById(chatbotId);

      // Check if the chatbot exists and belongs to the current user
      if (!chatbot || chatbot.userId !== user.id) {
        // If not, return a 404 error
        return new Response("Chatbot not found", { status: 404 });
      }

      return new Response(
        JSON.stringify({
          chatbot,
          user,
        })
      );
    },
    (error) => {
      return new Response(
        JSON.stringify({
          error: error.message || "Error loading chatbot",
        }),
        { status: 500 }
      );
    }
  );
};

/**
 * Main component for the chatbot config route
 * This is a placeholder that will be implemented in a future task
 */
export default function ChatbotConfigRoute() {
  const { chatbot } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Link
          to="/chat"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
        >
          ← Back to chatbots
        </Link>
        <h1 className="text-2xl font-bold">
          Configure Chatbot: {chatbot.name}
        </h1>
      </div>

      {/* Placeholder for the actual config UI that will be implemented in future tasks */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
        <p>The chatbot configuration UI will be implemented in future tasks.</p>
        <p>Chatbot ID: {chatbot.id}</p>
        <p>Status: {chatbot.status}</p>
      </div>
    </div>
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
