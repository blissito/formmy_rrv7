/**
 * Debug script para verificar el flujo de avatares desde DB hasta UI
 */
import { db } from "../app/utils/db.server";
import { transformConversationsToUI } from "../server/chatbot/conversationTransformer.server";

async function debugAvatars() {
  console.log("🔍 Verificando flujo de avatares...\n");

  // 1. Buscar contactos con profilePictureUrl
  const contactsWithAvatars = await db.contact.findMany({
    where: {
      profilePictureUrl: { not: null }
    },
    select: {
      id: true,
      name: true,
      phone: true,
      profilePictureUrl: true,
    },
    take: 5
  });

  console.log(`📋 Contactos con avatares en DB: ${contactsWithAvatars.length}`);
  contactsWithAvatars.forEach(contact => {
    console.log(`  - ${contact.name || 'Sin nombre'} (${contact.phone}): ${contact.profilePictureUrl?.substring(0, 50)}...`);
  });

  // 2. Buscar una conversación de WhatsApp reciente
  const recentConversation = await db.conversation.findFirst({
    where: {
      sessionId: { startsWith: "whatsapp_" }
    },
    include: {
      messages: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  if (!recentConversation) {
    console.log("\n❌ No se encontraron conversaciones de WhatsApp");
    return;
  }

  console.log(`\n📱 Conversación encontrada: ${recentConversation.id}`);
  console.log(`   sessionId: ${recentConversation.sessionId}`);
  console.log(`   visitorId: ${recentConversation.visitorId}`);

  // 3. Obtener todos los contactos para el transformer
  const allContacts = await db.contact.findMany({
    where: {
      chatbotId: recentConversation.chatbotId
    }
  });

  console.log(`\n📞 Total de contactos del chatbot: ${allContacts.length}`);

  // 4. Transformar a UI format
  const chatbot = await db.chatbot.findUnique({
    where: { id: recentConversation.chatbotId }
  });

  const uiConversations = transformConversationsToUI(
    [recentConversation],
    chatbot?.imageUrl || undefined,
    allContacts
  );

  const uiConv = uiConversations[0];
  console.log(`\n✅ Conversación transformada:`);
  console.log(`   userName: ${uiConv.userName}`);
  console.log(`   tel: ${uiConv.tel}`);
  console.log(`   avatar (conversation): ${uiConv.avatar}`);

  console.log(`\n📨 Mensajes transformados (primeros 3):`);
  uiConv.messages.slice(0, 3).forEach((msg, idx) => {
    console.log(`   [${idx + 1}] ${msg.role}:`);
    console.log(`       content: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    console.log(`       avatarUrl: ${msg.avatarUrl}`);
    console.log(`       picture: ${msg.picture || 'null'}`);
  });

  // 5. Verificar matching de teléfono
  const phoneFromSession = recentConversation.visitorId?.replace("whatsapp_", "") ||
                          recentConversation.sessionId?.replace("whatsapp_", "");

  if (phoneFromSession) {
    console.log(`\n🔎 Buscando contacto para teléfono: ${phoneFromSession}`);

    // Exact match
    const exactMatch = allContacts.find(c => c.phone === phoneFromSession);
    console.log(`   Exact match: ${exactMatch ? `✅ ${exactMatch.name} - ${exactMatch.profilePictureUrl?.substring(0, 30)}...` : '❌'}`);

    // Last 10 digits match
    const normalizedPhone = phoneFromSession.slice(-10);
    const normalizedMatch = allContacts.find(c => c.phone?.slice(-10) === normalizedPhone);
    console.log(`   Normalized match (last 10): ${normalizedMatch ? `✅ ${normalizedMatch.name} - ${normalizedMatch.profilePictureUrl?.substring(0, 30)}...` : '❌'}`);
  }

  console.log("\n✨ Diagnóstico completado");
}

debugAvatars()
  .catch(console.error)
  .finally(() => process.exit(0));
