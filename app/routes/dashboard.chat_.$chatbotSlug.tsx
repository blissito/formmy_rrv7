import { getUserOrRedirect } from "server/getUserUtils.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { useNavigate, useFetcher, useRevalidator, useSearchParams } from "react-router";
import { useEffect } from "react";
import { Conversations } from "~/components/chat/tab_sections/Conversations";
import { Contactos } from "~/components/chat/tab_sections/Contactos";
import { Entrenamiento } from "~/components/chat/tab_sections/Entrenamiento";
import { Codigo } from "~/components/chat/tab_sections/Codigo";
import { Configuracion } from "~/components/chat/tab_sections/Configuracion";
import { useChipTabs } from "~/components/chat/common/ChipTabs";
import { db } from "../utils/db.server";
import type { Route } from "./+types/dashboard.chat_.$chatbotSlug";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";
import {
  isUserInTrial,
  checkTrialExpiration,
  applyFreeRestrictions,
} from "server/chatbot/planLimits.server";
import { transformConversationsToUI } from "server/chatbot/conversationTransformer.server";
import { Plans } from "@prisma/client";
import { AIFlowCanvas } from "formmy-actions";
import "@xyflow/react/dist/style.css";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const { chatbotSlug } = params;

  if (!chatbotSlug) {
    throw new Response("Chatbot slug is required", { status: 400 });
  }

  // Primero intentar encontrar por slug
  let chatbot = await db.chatbot.findFirst({
    where: {
      slug: chatbotSlug,
    },
  });

  // Si no se encuentra por slug, intentar por ID (solo si es un ObjectID válido)
  if (
    !chatbot &&
    chatbotSlug.length === 24 &&
    /^[a-f\d]{24}$/i.test(chatbotSlug)
  ) {
    chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotSlug,
      },
    });
  }

  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  // Validate chatbot access using the new validation system
  const accessValidation = await validateChatbotAccess(user.id, chatbot.id);

  if (!accessValidation.canAccess) {
    const errorMessage =
      accessValidation.restrictionReason || "No tienes acceso a este chatbot";
    const status = accessValidation.restrictionReason?.includes("límite")
      ? 402
      : 403;
    throw new Response(errorMessage, { status });
  }

  // Verificar si el usuario TRIAL ha expirado y moverlo a FREE
  if (user.plan === Plans.TRIAL) {
    const { isExpired } = await checkTrialExpiration(user.id);

    if (isExpired) {
      // Mover usuario a FREE automáticamente
      await db.user.update({
        where: { id: user.id },
        data: { plan: Plans.FREE },
      });

      // Aplicar restricciones FREE: desactivar chatbots y formmys excedentes
      await applyFreeRestrictions(user.id);

      // Actualizar el usuario local para reflejar el cambio
      user.plan = Plans.FREE;
    }
  }

  // Verificar si el usuario FREE sin trial debería tener modelo null
  if (user.plan === Plans.FREE) {
    const { inTrial } = await isUserInTrial(user.id);

    // Si no está en trial y tiene un modelo activo, actualizarlo al modelo bloqueado
    if (!inTrial && chatbot.aiModel !== "blocked") {
      chatbot = await db.chatbot.update({
        where: { id: chatbot.id },
        data: { aiModel: "blocked" }, // Usar "blocked" para indicar sin acceso
      });
    }
  }

  const integrations = await db.integration.findMany({
    where: {
      chatbotId: chatbot.id,
    },
  });

  // Contar total de conversaciones
  const totalConversations = await db.conversation.count({
    where: {
      chatbotId: chatbot.id,
      status: { not: "DELETED" },
    },
  });

  // Obtener conversaciones reales con mensajes (primeras 50)
  const conversationsFromDB = await db.conversation.findMany({
    where: {
      chatbotId: chatbot.id,
      status: { not: "DELETED" },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        where: { deleted: { not: true } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50, // Limitar a las 50 conversaciones más recientes (primera carga)
  });

  // Transformar a formato UI
  const conversations = transformConversationsToUI(
    conversationsFromDB,
    chatbot.avatarUrl || undefined
  );

  // Obtener contactos del chatbot
  const contacts = await db.contact.findMany({
    where: {
      chatbotId: chatbot.id,
    },
    orderBy: {
      capturedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      position: true,
      website: true,
      notes: true,
      source: true,
      status: true,
      capturedAt: true,
      lastUpdated: true,
      conversationId: true,
      chatbotId: true,
    },
  });

  // Filtrar contextos sin embeddings (documentos eliminados)
  if (chatbot.contexts && chatbot.contexts.length > 0) {
    const allEmbeddings = await db.embedding.findMany({
      where: { chatbotId: chatbot.id },
      select: { metadata: true }
    });

    // Filtrar solo contextos que tienen embeddings
    chatbot.contexts = chatbot.contexts.filter((ctx: any) => {
      const hasEmbeddings = allEmbeddings.some((emb: any) =>
        emb.metadata?.contextId === ctx.id
      );
      return hasEmbeddings;
    });
  }

  return {
    user,
    chatbot,
    integrations,
    conversations,
    totalConversations,
    contacts,
    accessInfo: accessValidation,
  };
};

export default function ChatbotDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { user, chatbot, integrations, conversations, totalConversations, contacts, accessInfo } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  // Leer query params de forma reactiva
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');

  const { currentTab, setCurrentTab } = useChipTabs(
    tabFromQuery || "Preview",
    `main_${chatbot.id}`
  );

  // Actualizar tab cuando cambien los query params
  useEffect(() => {
    if (tabFromQuery && tabFromQuery !== currentTab) {
      setCurrentTab(tabFromQuery);
    }
  }, [tabFromQuery, currentTab, setCurrentTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  // Toggle manual mode for conversation
  const handleToggleManual = async (conversationId: string) => {
    console.log("🔄 Route handleToggleManual called:", conversationId);

    try {
      const response = await fetch(`/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "toggle_manual",
          conversationId,
        }),
      });

      console.log("📡 Toggle response:", response.status, response.statusText);
      console.log(
        "📡 Toggle response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Toggle error response:", errorText);
        throw new Error(
          `Error toggling manual mode: ${response.status} - ${errorText}`
        );
      }

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const htmlText = await response.text();
        console.error("❌ Response is not JSON:", htmlText);
        throw new Error(
          "Server returned HTML instead of JSON - check API endpoint"
        );
      }

      const result = await response.json();
      console.log("✅ Toggle result:", result);

      if (!result.success) {
        throw new Error(result.error || "Unknown error toggling manual mode");
      }

      // Refresh conversations after toggle - trigger revalidation
      navigate(window.location.pathname, { replace: true });
    } catch (error) {
      console.error("❌ Error toggling manual mode:", error);
      alert(`Error al cambiar modo manual: ${error.message}`);
    }
  };

  // Send manual response
  const handleSendManualResponse = async (
    conversationId: string,
    message: string
  ) => {
    console.log("🚀 Route handleSendManualResponse called:", {
      conversationId,
      messageLength: message.length,
    });

    try {
      const response = await fetch(`/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "send_manual_response",
          conversationId,
          message,
        }),
      });

      console.log("📡 Send response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Send error response:", errorText);
        throw new Error(
          `Error sending manual response: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ Send result:", result);

      if (!result.success) {
        throw new Error(
          result.error || "Unknown error sending manual response"
        );
      }

      // Log result (no alert - no interrumpir flujo de conversación)
      console.log("✅ Manual response sent:", {
        channel: result.channel,
        whatsappSent: result.whatsappSent,
        message: result.message
      });

      // Solo mostrar error si realmente falló
      if (result.channel === "whatsapp" && result.whatsappError) {
        console.error("❌ WhatsApp send failed:", result.whatsappError);
        // Opcional: Agregar toast notification aquí en el futuro
      }

      // Refresh conversations after sending - trigger revalidation
      navigate(window.location.pathname, { replace: true });
    } catch (error) {
      console.error("❌ Error sending manual response:", error);
      alert(`Error al enviar respuesta manual: ${error.message}`);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    console.log("🗑️ Route handleDeleteConversation called:", conversationId);

    try {
      const response = await fetch(`/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "delete_conversation",
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Delete error response:", errorText);
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Delete result:", result);

      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }

      // Trigger revalidation explicitly
      console.log("🔄 Triggering revalidation...");
      revalidator.revalidate();
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      alert(`Error al eliminar conversación: ${error.message}`);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (conversationId: string) => {
    console.log("⭐ Route handleToggleFavorite called:", conversationId);

    try {
      const response = await fetch(`/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "toggle_favorite",
          conversationId,
        }),
      });

      console.log("📡 Toggle favorite response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Toggle favorite error response:", errorText);
        throw new Error(
          `Error toggling favorite: ${response.status} - ${errorText}`
        );
      }

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const htmlText = await response.text();
        console.error("❌ Response is not JSON:", htmlText);
        throw new Error(
          "Server returned HTML instead of JSON - check API endpoint"
        );
      }

      const result = await response.json();
      console.log("✅ Toggle favorite result:", result);

      if (!result.success) {
        throw new Error(result.error || "Unknown error toggling favorite");
      }

      // Refresh conversations after toggle - trigger revalidation
      navigate(window.location.pathname, { replace: true });
    } catch (error) {
      console.error("❌ Error toggling favorite:", error);
      alert(`Error al marcar como favorito: ${error.message}`);
    }
  };

  return (
    <PageContainer>
      <div className="bg-white sticky top-0 z-10">
      <PageContainer.Title className="!mb-2 md:!mb-4" back="/dashboard/chat">
        {chatbot.name}
      </PageContainer.Title>
      <PageContainer.TabSelector
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
      </div>
      <div className="mt-0 overflow-hidden h-full">
        {currentTab === "Preview" && (
          <PageContainer.EditionPair
            chatbot={chatbot}
            user={user}
            currentTab={currentTab}
          />
        )}
        {currentTab === "Conversaciones" && (
          <Conversations
            chatbot={chatbot}
            user={user}
            conversations={conversations}
            totalConversations={totalConversations}
            onToggleManual={handleToggleManual}
            onSendManualResponse={handleSendManualResponse}
            onDeleteConversation={handleDeleteConversation}
            onToggleFavorite={handleToggleFavorite}
            selectedConversationId={searchParams.get('conversation') || undefined}
          />
        )}
        {currentTab === "Contactos" && (
          <Contactos chatbot={chatbot} user={user} contacts={contacts} />
        )}
        {currentTab === "Entrenamiento" && (
          <Entrenamiento chatbot={chatbot} user={user} />
        )}
        {currentTab === "Tareas" && <Tareas />}
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
  return (
    <section className="h-full min-h-[60vh] place-items-center grid">
    <div>
      <img className="w-40 md:w-[200px] mx-auto" src="/dash/comming.svg" alt="comming soon" />
      <h3 className="text-2xl font-bold text-dark text-center heading mt-6">Tareas Automatizadas en Camino</h3>
      <p className="paragraph text-center text-metal mt-3 max-w-md mx-auto">Estamos trabajando en una poderosa herramienta para que automatices tareas recurrentes y optimices la productividad de tu agente. ¡Muy pronto podrás programar acciones y flujos de trabajo personalizados!</p>
    </div>
  </section>
  
  );
};




// <section className="h-full min-h-[60vh] p-4">
// <AIFlowCanvas
//   showToaster={false}
//   isolateStyles={true}
//   containerHeight="100%"
//   theme="light"
// />
// </section>