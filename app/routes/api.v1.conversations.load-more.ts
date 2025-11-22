import { db } from "~/utils/db.server";
import { transformConversationsToUI } from "server/chatbot/conversationTransformer.server";
import type { Route } from "./+types/api.v1.conversations.load-more";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const startTime = Date.now();
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get('chatbotId');
  const skip = parseInt(url.searchParams.get('skip') || '0');
  const take = 20; // ⚡ Reducido de 50 a 20 para cargar más rápido

  console.log(`🔄 [Load More] Cargando conversaciones: skip=${skip}, take=${take}`);

  if (!chatbotId) {
    return Response.json({ error: "chatbotId is required" }, { status: 400 });
  }

  try {
    // ⚡ Cargar conversaciones con mensajes incluidos (limitados)
    const conversationsFromDB = await db.conversation.findMany({
      where: {
        chatbotId,
        status: { not: "DELETED" },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          where: { deleted: { not: true } },
          take: 50, // Solo últimos 50 mensajes por conversación
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    });

    const totalMessages = conversationsFromDB.reduce((sum, c: any) => sum + (c.messages?.length || 0), 0);
    console.log(`✅ [Load More] ${conversationsFromDB.length} conversaciones, ${totalMessages} mensajes en ${Date.now() - startTime}ms`);

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
    const transformStart = Date.now();
    const conversations = transformConversationsToUI(
      sortedConversations,
      chatbot?.avatarUrl || undefined
    );
    console.log(`✅ [Load More] Transformación completada en ${Date.now() - transformStart}ms`);

    console.log(`🏁 [Load More] Tiempo total: ${Date.now() - startTime}ms`);

    return Response.json({
      conversations,
      hasMore: conversations.length === take,
    });
  } catch (error) {
    console.error("❌ [Load More] Error loading more conversations:", error);
    return Response.json({ error: "Failed to load conversations" }, { status: 500 });
  }
};
