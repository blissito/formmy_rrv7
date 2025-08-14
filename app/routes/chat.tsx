import { useSubmit } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getUserChatbotsWithPlanInfo } from "server/chatbot/userModel.server";
import { PageContainer } from "~/components/chat/PageContainer";
import type { Route } from "./+types/chat";
import type { Chatbot } from "@prisma/client";
import toast from "react-hot-toast";
import { useState } from "react";
import ConfirmModal from "~/components/ConfirmModal";
import { effect } from "../utils/effect";
import { Button } from "~/components/Button";

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
 * Main component for the chat list routeProps
 * This is a placeholder that will be implemented in a future task
 */
export default function ChatListRoute({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const {
    chatbots = [],
    plan,
    limits = { maxChatbots: 1 },
    canCreateMore,
    user,
  } = loaderData;

  // Estado para controlar la visibilidad del modal de límite
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<{
    error: string;
    currentCount: number;
    maxAllowed: number;
    isPro: boolean;
  } | null>(null);
  const [shouldDelete, setShouldDelete] = useState("");
  const [isLoading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await effect(
      async () => {
        const response = await fetch("/api/v1/chatbot", {
          method: "post",
          body: new URLSearchParams({
            intent: "delete_chatbot",
            chatbotId: shouldDelete,
          }),
        });
        const data = await response.json();

        if (!data.success && data.error) {
          toast.error(data.error);
        } else {
          submit({});
          setShouldDelete("");
        }
      },
      (error) => {
        console.error("Error al eliminar chatbot:", error);
        toast.error("Error al eliminar chatbot: " + error.message);
      }
    );
    setLoading(false);
  };

  const handleDeleteIntention = (id: string) => () => {
    setShouldDelete(id);
  };

  return (
    <>
      <PageContainer>
        <PageContainer.Header user={user} />
        <PageContainer.Title
          cta={
            <PageContainer.Button isLoading={isLoading} to="/chat/nuevo">
              + Chat
            </PageContainer.Button>
          }
        >
          Tus Chats IA
        </PageContainer.Title>
        <section className="my-10 flex flex-wrap gap-6">
          {chatbots.map((chatbot: Chatbot, i: number) => (
            <PageContainer.ChatCard
              onDelete={handleDeleteIntention(chatbot.id)}
              key={i}
              chatbot={chatbot}
            />
          ))}
        </section>
      </PageContainer>

      {/* Modal de eliminación */}
      {shouldDelete && (
        <ConfirmModal
          isOpen={!!shouldDelete}
          onClose={() => setShouldDelete("")}
          title="¿Estás segur@ de eliminar este chatbot?"
          message={`Si lo eliminas, toda la información y todas las conversaciones serán eliminadas de forma permanente.`}
          emojis="✋🏻⛔️🤖"
          footer={
            <div className="flex justify-center gap-6">
              <button
                onClick={handleDelete}
                className="bg-gray-100 text-gray-600 mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6"
              >
                Sí, quiero eliminarlo
              </button>
              <Button
                onClick={() => {
                  setShouldDelete("");
                }}
                className="bg-perl text-metal hover:bg-[#E1E3E7]"
              >
                Cancelar
              </Button>
            </div>
          }
        />
      )}

      {/* Modal de límite de chatbots */}
      {limitError && (
        <ConfirmModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          title="Límite de chatbots alcanzado"
          message={`Has alcanzado el límite de ${limitError.maxAllowed} chatbots para tu plan actual. Actualiza a un plan superior para crear más chatbots.`}
          emojis="🤖🔒💼"
          footer={
            <div className="flex gap-6 mb-6">
              <button
                onClick={() => setShowLimitModal(false)}
                className="bg-gray-100 text-gray-600 mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6"
              >
                Entendido
              </button>
              <button
                onClick={() => {
                  // Aquí puedes redirigir a la página de planes
                  window.location.href = "/planes";
                  setShowLimitModal(false);
                }}
                className="bg-brand-500 text-white mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6"
              >
                Ver planes
              </button>
            </div>
          }
        />
      )}
    </>
  );
}

export const meta = () => [
  { title: "My Chatbots" },
  { name: "description", content: "Manage your chatbots" },
];
