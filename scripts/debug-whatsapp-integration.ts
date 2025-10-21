import { db } from "../app/utils/db.server";

async function debugIntegration() {
  console.log("=== WhatsApp Integration Debug ===\n");

  const integrations = await db.integration.findMany({
    where: { platform: "WHATSAPP" },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true,
          slug: true,
          userId: true
        }
      }
    }
  });

  if (integrations.length === 0) {
    console.log("❌ No WhatsApp integrations found");
    return;
  }

  for (const int of integrations) {
    console.log("──────────────────────────────────");
    console.log(`Chatbot: ${int.chatbot?.name} (${int.chatbot?.slug})`);
    console.log(`Integration ID: ${int.id}`);
    console.log(`Platform: ${int.platform}`);
    console.log(`Active: ${int.isActive ? '✅' : '❌'}`);
    console.log(`\nWhatsApp Config:`);
    console.log(`  Phone Number ID: ${int.phoneNumberId || '❌ MISSING'}`);
    console.log(`  Business Account ID: ${int.businessAccountId || '❌ MISSING'}`);
    console.log(`  Token: ${int.token ? '✅ Present (***' + int.token.slice(-6) + ')' : '❌ NULL'}`);
    console.log(`  Token Length: ${int.token?.length || 0} chars`);
    console.log(`  Webhook Verify Token: ${int.webhookVerifyToken || '❌ MISSING'}`);
    console.log(`\nDates:`);
    console.log(`  Created: ${int.createdAt}`);
    console.log(`  Updated: ${int.updatedAt}`);

    // Verificar si hay conversaciones
    const convCount = await db.conversation.count({
      where: { chatbotId: int.chatbotId }
    });
    console.log(`\nConversations: ${convCount}`);

    // Verificar último mensaje
    const lastMessage = await db.message.findFirst({
      where: {
        conversation: { chatbotId: int.chatbotId }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        content: true,
        createdAt: true,
        sender: true
      }
    });

    if (lastMessage) {
      console.log(`\nLast Message:`);
      console.log(`  From: ${lastMessage.sender}`);
      console.log(`  Time: ${lastMessage.createdAt}`);
      console.log(`  Content: ${lastMessage.content.substring(0, 50)}...`);
    }

    console.log("──────────────────────────────────\n");
  }

  // Test de validación
  console.log("\n=== Validation Checks ===");
  for (const int of integrations) {
    const checks = {
      hasToken: !!int.token,
      hasPhoneNumberId: !!int.phoneNumberId,
      hasBusinessAccountId: !!int.businessAccountId,
      hasWebhookToken: !!int.webhookVerifyToken,
      isActive: int.isActive
    };

    const allValid = Object.values(checks).every(v => v === true);

    console.log(`\n${int.chatbot?.name}:`);
    console.log(`  ${checks.hasToken ? '✅' : '❌'} Access Token`);
    console.log(`  ${checks.hasPhoneNumberId ? '✅' : '❌'} Phone Number ID`);
    console.log(`  ${checks.hasBusinessAccountId ? '✅' : '❌'} Business Account ID`);
    console.log(`  ${checks.hasWebhookToken ? '✅' : '❌'} Webhook Verify Token`);
    console.log(`  ${checks.isActive ? '✅' : '❌'} Active`);
    console.log(`  ${allValid ? '✅ READY' : '❌ INCOMPLETE'}`);
  }
}

debugIntegration()
  .catch(console.error)
  .finally(() => process.exit(0));
