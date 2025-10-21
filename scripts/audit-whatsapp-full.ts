import { db } from "../app/utils/db.server";

async function fullAudit() {
  console.log("🔍 ===== AUDITORÍA COMPLETA WhatsApp =====\n");

  // 1. Estado de la integración
  console.log("📋 1. ESTADO DE INTEGRACIÓN\n");
  const integration = await db.integration.findFirst({
    where: { platform: "WHATSAPP", isActive: true },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true,
          slug: true,
          aiModel: true,
          userId: true
        }
      }
    }
  });

  if (!integration) {
    console.log("❌ NO HAY INTEGRACIÓN ACTIVA DE WHATSAPP");
    return;
  }

  console.log("Integración encontrada:");
  console.log(`  ID: ${integration.id}`);
  console.log(`  Chatbot: ${integration.chatbot?.name} (${integration.chatbot?.slug})`);
  console.log(`  Phone Number ID: ${integration.phoneNumberId || '❌ MISSING'}`);
  console.log(`  Business Account ID: ${integration.businessAccountId || '❌ MISSING'}`);
  console.log(`  Token: ${integration.token ? '✅ Present (' + integration.token.length + ' chars, ***' + integration.token.slice(-6) + ')' : '❌ NULL'}`);
  console.log(`  Webhook Verify Token: ${integration.webhookVerifyToken || '❌ MISSING'}`);
  console.log(`  Active: ${integration.isActive ? '✅' : '❌'}`);
  console.log(`  Created: ${integration.createdAt}`);
  console.log(`  Updated: ${integration.updatedAt}`);

  // 2. Verificar conversaciones recientes
  console.log("\n📱 2. CONVERSACIONES RECIENTES (últimas 5)\n");
  const recentConversations = await db.conversation.findMany({
    where: { chatbotId: integration.chatbotId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      sessionId: true,
      status: true,
      messageCount: true,
      manualMode: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { messages: true }
      }
    }
  });

  if (recentConversations.length === 0) {
    console.log("⚠️  No hay conversaciones registradas");
  } else {
    for (const conv of recentConversations) {
      console.log(`─────────────────────────────────────`);
      console.log(`  ID: ${conv.id}`);
      console.log(`  Session ID: ${conv.sessionId}`);
      console.log(`  Status: ${conv.status}`);
      console.log(`  Messages: ${conv._count.messages} (count: ${conv.messageCount})`);
      console.log(`  Manual Mode: ${conv.manualMode ? '✅' : '❌'}`);
      console.log(`  Favorite: ${conv.isFavorite ? '⭐' : ''}`);
      console.log(`  Created: ${conv.createdAt}`);
      console.log(`  Updated: ${conv.updatedAt}`);
    }
  }

  // 3. Mensajes recientes
  console.log("\n💬 3. MENSAJES RECIENTES (últimos 10)\n");
  const recentMessages = await db.message.findMany({
    where: {
      conversation: { chatbotId: integration.chatbotId }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      role: true,
      content: true,
      channel: true,
      externalMessageId: true,
      createdAt: true,
      conversationId: true
    }
  });

  if (recentMessages.length === 0) {
    console.log("⚠️  No hay mensajes registrados");
  } else {
    for (const msg of recentMessages) {
      console.log(`─────────────────────────────────────`);
      console.log(`  ${msg.role === 'USER' ? '👤 USER' : '🤖 ASSISTANT'}: ${msg.content.substring(0, 60)}...`);
      console.log(`  Channel: ${msg.channel}`);
      console.log(`  External ID: ${msg.externalMessageId || 'N/A'}`);
      console.log(`  Created: ${msg.createdAt}`);
      console.log(`  Conversation: ${msg.conversationId}`);
    }
  }

  // 4. Verificar usuario dueño del chatbot
  console.log("\n👤 4. USUARIO DUEÑO DEL CHATBOT\n");
  const user = await db.user.findFirst({
    where: { id: integration.chatbot?.userId },
    select: {
      id: true,
      email: true,
      plan: true,
      toolCreditsUsed: true,
      purchasedCredits: true,
      creditsResetAt: true
    }
  });

  if (user) {
    console.log(`  Email: ${user.email}`);
    console.log(`  Plan: ${user.plan}`);
    console.log(`  Tool Credits Used: ${user.toolCreditsUsed}`);
    console.log(`  Purchased Credits: ${user.purchasedCredits}`);
    console.log(`  Credits Reset: ${user.creditsResetAt}`);
  } else {
    console.log("❌ Usuario no encontrado");
  }

  // 5. Test de validación completa
  console.log("\n🔬 5. VALIDACIÓN COMPLETA\n");

  const checks = {
    hasIntegration: !!integration,
    hasToken: !!integration.token,
    hasPhoneNumberId: !!integration.phoneNumberId,
    hasBusinessAccountId: !!integration.businessAccountId,
    hasWebhookToken: !!integration.webhookVerifyToken,
    isActive: integration.isActive,
    hasChatbot: !!integration.chatbot,
    hasUser: !!user,
    tokenLength: integration.token?.length || 0
  };

  console.log(`  ${checks.hasIntegration ? '✅' : '❌'} Integration exists`);
  console.log(`  ${checks.hasToken ? '✅' : '❌'} Access Token present (${checks.tokenLength} chars)`);
  console.log(`  ${checks.hasPhoneNumberId ? '✅' : '❌'} Phone Number ID configured`);
  console.log(`  ${checks.hasBusinessAccountId ? '✅' : '❌'} Business Account ID configured`);
  console.log(`  ${checks.hasWebhookToken ? '✅' : '❌'} Webhook Verify Token configured`);
  console.log(`  ${checks.isActive ? '✅' : '❌'} Integration is active`);
  console.log(`  ${checks.hasChatbot ? '✅' : '❌'} Chatbot configured`);
  console.log(`  ${checks.hasUser ? '✅' : '❌'} User exists`);

  const allValid = Object.entries(checks)
    .filter(([key]) => key !== 'tokenLength')
    .every(([_, value]) => value === true);

  console.log(`\n${allValid ? '✅ CONFIGURACIÓN COMPLETA' : '❌ FALTAN CONFIGURACIONES'}`);

  // 6. Info para debugging
  console.log("\n🔧 6. INFO PARA DEBUGGING\n");
  console.log(`Webhook URL esperado:`);
  console.log(`  https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook`);
  console.log(`\nWebhook Verify Token:`);
  console.log(`  ${integration.webhookVerifyToken || 'N/A'}`);
  console.log(`\nPara probar manualmente:`);
  console.log(`  curl -X POST https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"test","text":{"body":"test"}}]}}]}]}'`);

  console.log("\n====================================\n");
}

fullAudit()
  .catch(console.error)
  .finally(() => process.exit(0));
