import { getUserOrRedirect } from "server/getUserUtils.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { useNavigate, useFetcher, useRevalidator, useSearchParams } from "react-router";
import { useEffect } from "react";
import { Conversations } from "~/components/chat/tab_sections/Conversations";
import { Contactos } from "~/components/chat/tab_sections/Contactos";
import { Entrenamiento } from "~/components/chat/tab_sections/Entrenamiento";
import { Herramientas } from "~/components/chat/tab_sections/Herramientas";
import { Codigo } from "~/components/chat/tab_sections/Codigo";
import { Configuracion } from "~/components/chat/tab_sections/Configuracion";
import { useChipTabs } from "~/components/chat/common/ChipTabs";
import { db } from "../utils/db.server";
import type { Route } from "./+types/dashboard.chat_.$chatbotSlug";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";
// ⚡ OPTIMIZACIÓN: Importaciones comentadas temporalmente para debug de performance
// import {
//   isUserInTrial,
//   checkTrialExpiration,
//   applyFreeRestrictions,
// } from "server/chatbot/planLimits.server";
// ⚡ FASE 1: transformConversationsToUI no se usa más - conversaciones se procesan en el cliente
// import { transformConversationsToUI } from "server/chatbot/conversationTransformer.server";
import { Plans } from "@prisma/client";
import { AIFlowCanvas } from "formmy-actions";
import "@xyflow/react/dist/style.css";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const { chatbotSlug } = params;

  if (!chatbotSlug) {
    throw new Response("Chatbot slug is required", { status: 400 });
  }

  // WhatsApp Embedded Signup NO usa OAuth redirect - usa window.postMessage

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

  // ⚡ OPTIMIZACIÓN: Validaciones de plan comentadas temporalmente para debug de performance
  // TODO: Re-habilitar después de optimizar queries
  /*
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
  */

  // ⚡ FASE 1: Loader mínimo - solo metadata (conversaciones se cargan en cliente)
  const [integrations, totalConversations, contextDocuments, customTools] = await Promise.all([
    db.integration.findMany({
      where: { chatbotId: chatbot.id },
    }),
    db.conversation.count({
      where: {
        chatbotId: chatbot.id,
        status: { not: "DELETED" },
      },
    }),
    // ✅ Cargar contextos desde el modelo Context (sistema nuevo)
    db.context.findMany({
      where: { chatbotId: chatbot.id },
      select: {
        id: true,
        title: true,
        content: true,
        contextType: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    // 🔧 Cargar herramientas personalizadas del chatbot
    db.customTool.findMany({
      where: { chatbotId: chatbot.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // ⚡ OPTIMIZACIÓN: Conversaciones, mensajes, contactos y leads se cargan bajo demanda desde el cliente
  // Esto reduce el payload inicial del loader de ~120KB a ~5KB y elimina el bloqueo de navegación

  // TODO: Filtro deshabilitado temporalmente - causaba que contextos desaparecieran
  // Si se re-habilita, debe verificarse que los embeddings se creen ANTES de que el loader ejecute
  /*
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
  */

  return {
    user,
    chatbot,
    integrations,
    conversations: [], // ⚡ FASE 1: Se cargan desde el cliente con infinity scroll
    totalConversations,
    contacts: [], // ⚡ Leads se cargan bajo demanda en el tab Contactos
    contextDocuments, // ✅ Contextos desde el modelo Context (sistema nuevo)
    customTools, // 🔧 Herramientas HTTP personalizadas
    accessInfo: accessValidation,
  };
};

export default function ChatbotDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { user, chatbot, integrations, conversations, totalConversations, contacts, contextDocuments, customTools, accessInfo } = loaderData;
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

  // ✅ Procesar callback de WhatsApp Embedded Signup (Authorization Code Flow)
  useEffect(() => {
    // Flag para evitar ejecuciones múltiples
    let processed = false;

    const handleWhatsAppCallback = async () => {
      if (processed) return;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('❌ [WhatsApp Callback] Error:', error, errorDescription);
        alert(`Error conectando WhatsApp: ${errorDescription || error}`);
        return;
      }

      if (code) {
        processed = true; // Marcar como procesado para evitar ejecuciones múltiples

        // Validar state (CSRF protection)
        const storedState = sessionStorage.getItem('whatsapp_oauth_state');
        if (storedState && state !== storedState) {
          console.error('❌ [WhatsApp Callback] State mismatch - posible CSRF attack');
          alert('Error de seguridad: validación de state falló');
          return;
        }

        // Limpiar session storage
        sessionStorage.removeItem('whatsapp_oauth_state');
        const storedChatbotId = sessionStorage.getItem('whatsapp_oauth_chatbotId');
        sessionStorage.removeItem('whatsapp_oauth_chatbotId');

        // Intercambiar code por access_token
        try {
          const redirectUri = `${window.location.origin}/dashboard/chat/${chatbot.slug || chatbot.id}`;

          const response = await fetch('/api/v1/integrations/whatsapp/embedded_signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatbotId: storedChatbotId || chatbot.id,
              code: code,
              redirectUri: redirectUri
            })
          });

          const data = await response.json();

          if (!response.ok && response.status !== 207) {
            throw new Error(data.error || 'Error al conectar WhatsApp');
          }

          // Limpiar URL (remover query params) y recargar datos
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('code');
          cleanUrl.searchParams.delete('state');
          window.history.replaceState({}, '', cleanUrl.toString());

          // Revalidar después de procesar exitosamente
          revalidator.revalidate();
        } catch (err) {
          console.error('❌ [WhatsApp Callback] Error:', err);
          alert(`Error al procesar WhatsApp: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
      }
    };

    handleWhatsAppCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chatbot.id, chatbot.slug]); // Removido 'revalidator' para evitar loops

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  // Toggle manual mode for conversation
  const handleToggleManual = async (conversationId: string) => {

    try {
      const response = await fetch(`/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "toggle_manual",
          conversationId,
        }),
      });


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
  // Retorna { messageId, content } en éxito para que Conversations.tsx pueda hacer optimistic update
  const handleSendManualResponse = async (
    conversationId: string,
    message: string
  ): Promise<{ messageId: string; content: string } | null> => {

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


      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Send error response:", errorText);
        throw new Error(
          `Error sending manual response: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Unknown error sending manual response"
        );
      }

      // Solo mostrar error si WhatsApp realmente falló
      if (result.channel === "whatsapp" && result.whatsappError) {
        console.error("❌ WhatsApp send failed:", result.whatsappError);
      }

      // ✅ Retornar resultado para optimistic update en Conversations.tsx
      return {
        messageId: result.messageId,
        content: message,
      };
    } catch (error) {
      console.error("❌ Error sending manual response:", error);
      alert(`Error al enviar respuesta manual: ${error.message}`);
      return null;
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId: string) => {

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

      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }

      // Trigger revalidation explicitly
      revalidator.revalidate();
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      alert(`Error al eliminar conversación: ${error.message}`);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (conversationId: string) => {

    try {
      const response = await fetch(`/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "toggle_favorite",
          conversationId,
        }),
      });


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
      <div className="sticky top-0 z-10 bg-white pb-1">
      <PageContainer.Title className="!mb-2 lg:!mb-4" back="/dashboard/chat">
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
            integrations={integrations}
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
          <Entrenamiento chatbot={chatbot} user={user} contextDocuments={contextDocuments} />
        )}
        {currentTab === "Tareas" && <Tareas />}
        {currentTab === "Herramientas" && (
          <Herramientas chatbot={chatbot} user={user} customTools={customTools} />
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
  return (
    <section className="h-full min-h-[60vh] place-items-center grid">
    <div>
      <img className="w-40 lg:w-[200px] mx-auto" src="/dash/comming.svg" alt="comming soon" />
      <h3 className="text-xl lg:text-2xl font-bold text-dark text-center heading mt-6">Tareas automatizadas en camino</h3>
      <p className="text-sm lg:text-base paragraph text-center text-metal mt-3 max-w-md mx-auto">Estamos trabajando en una poderosa herramienta para que automatices tareas recurrentes y optimices la productividad de tu agente. ¡Muy pronto podrás programar acciones y flujos de trabajo personalizados!</p>
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