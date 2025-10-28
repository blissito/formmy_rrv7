import { db } from "~/utils/db.server";
import { transformConversationsToUI } from "server/chatbot/conversationTransformer.server";
import type { Route } from "./+types/api.v1.conversations.load-more";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get('chatbotId');
  const skip = parseInt(url.searchParams.get('skip') || '0');
  const take = 50; // Cargar 50 conversaciones más cada vez

  if (!chatbotId) {
    return Response.json({ error: "chatbotId is required" }, { status: 400 });
  }

  try {
    const conversationsFromDB = await db.conversation.findMany({
      where: {
        chatbotId,
        status: { not: "DELETED" },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          where: { deleted: { not: true } },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    });

    // Ordenar conversaciones por el timestamp del último mensaje de USUARIO
    const sortedConversations = conversationsFromDB.sort((a, b) => {
      // Obtener el último mensaje del usuario para cada conversación
      const lastUserMessageA = a.messages
        .filter(msg => msg.role === "USER")
        .slice(-1)[0];
      const lastUserMessageB = b.messages
        .filter(msg => msg.role === "USER")
        .slice(-1)[0];

      // Si no hay mensajes de usuario, usar updatedAt como fallback
      const timeA = lastUserMessageA?.createdAt || a.updatedAt;
      const timeB = lastUserMessageB?.createdAt || b.updatedAt;

      // Ordenar descendente (más reciente primero)
      return timeB.getTime() - timeA.getTime();
    });

    // Obtener avatar del chatbot para transformar
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: { avatarUrl: true },
    });

    // Transformar a formato UI
    const conversations = transformConversationsToUI(
      sortedConversations,
      chatbot?.avatarUrl || undefined
    );

    return Response.json({
      conversations,
      hasMore: conversations.length === take,
    });
  } catch (error) {
    console.error("Error loading more conversations:", error);
    return Response.json({ error: "Failed to load conversations" }, { status: 500 });
  }
};
