/**
 * Script de migración y limpieza masiva
 *
 * ELIMINA todos los chatbots excepto:
 * - Chatbot ID: 691fe6f9aaf51e4d69c10b8e
 * - Usuario ID: 691fe21caaf51e4d69c10b87
 *
 * MIGRA contextos legacy (array contexts[]) al nuevo sistema (Context + Embeddings)
 *
 * USO: npx tsx scripts/migrate-contexts-and-cleanup.ts
 */

import { db } from "../app/utils/db.server";
import { secureUpsert } from "../server/context/vercel_embeddings.secure";
import fs from "fs";
import path from "path";

const PRESERVED_USER_ID = "691fe21caaf51e4d69c10b87";
const PRESERVED_CHATBOT_ID = "691fe6f9aaf51e4d69c10b8e";

async function main() {
  console.log("🚀 Iniciando script de migración y limpieza masiva\n");

  // ========================================
  // FASE 1: BACKUP
  // ========================================
  console.log("📦 FASE 1: Exportando backup de contexts[] legacy...");

  const chatbot = await db.chatbot.findUnique({
    where: { id: PRESERVED_CHATBOT_ID },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
      contexts: true,
    },
  });

  if (!chatbot) {
    throw new Error(`❌ Chatbot ${PRESERVED_CHATBOT_ID} no encontrado`);
  }

  if (chatbot.userId !== PRESERVED_USER_ID) {
    throw new Error(
      `❌ El chatbot pertenece al usuario ${chatbot.userId}, no a ${PRESERVED_USER_ID}`
    );
  }

  const backupPath = path.join(process.cwd(), "backup-contexts.json");
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        chatbotId: chatbot.id,
        chatbotSlug: chatbot.slug,
        chatbotName: chatbot.name,
        userId: chatbot.userId,
        totalContexts: chatbot.contexts.length,
        contexts: chatbot.contexts,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log(`✅ Backup guardado en: ${backupPath}`);
  console.log(`   Total de contextos a migrar: ${chatbot.contexts.length}\n`);

  // ========================================
  // FASE 2: MIGRACIÓN DE CONTEXTOS
  // ========================================
  console.log("🔄 FASE 2: Migrando contextos al nuevo sistema...");

  let migratedCount = 0;
  let failedCount = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < chatbot.contexts.length; i++) {
    const contextItem = chatbot.contexts[i];

    try {
      console.log(`   [${i + 1}/${chatbot.contexts.length}] Migrando: ${contextItem.title || contextItem.fileName || contextItem.url || "Sin título"}...`);

      // Validar que tenga contenido
      if (!contextItem.content || contextItem.content.trim().length === 0) {
        console.log(`   ⚠️  Saltando (sin contenido)`);
        continue;
      }

      // Preparar metadata
      const metadata: any = {
        contextType: contextItem.type,
      };

      // Agregar campos opcionales si existen
      if (contextItem.fileName) metadata.fileName = contextItem.fileName;
      if (contextItem.fileType) metadata.fileType = contextItem.fileType;
      if (contextItem.fileUrl) metadata.fileUrl = contextItem.fileUrl;
      if (contextItem.url) metadata.url = contextItem.url;
      if (contextItem.sizeKB) metadata.sizeKB = contextItem.sizeKB;
      if (contextItem.routes && contextItem.routes.length > 0) {
        metadata.routes = contextItem.routes;
      }
      if (contextItem.questions) metadata.questions = contextItem.questions;
      if (contextItem.answer) metadata.answer = contextItem.answer;
      if (contextItem.parsingMode) metadata.parsingMode = contextItem.parsingMode;
      if (contextItem.parsingPages) metadata.parsingPages = contextItem.parsingPages;
      if (contextItem.parsingCredits) metadata.parsingCredits = contextItem.parsingCredits;

      // Crear Context + Embeddings usando servicio seguro
      const result = await secureUpsert({
        chatbotId: PRESERVED_CHATBOT_ID,
        userId: PRESERVED_USER_ID,
        title: contextItem.title || contextItem.fileName || contextItem.url || `Contexto ${i + 1}`,
        content: contextItem.content,
        metadata,
      });

      // Si result.context es undefined, significa que el contenido era duplicado y fue eliminado
      if (!result || !result.context) {
        console.log(`   ⚠️  Contenido duplicado, saltando...`);
        continue;
      }

      console.log(`   ✅ Migrado exitosamente (Context ID: ${result.context.id})`);
      migratedCount++;
    } catch (error) {
      console.error(`   ❌ Error al migrar:`, error);
      failedCount++;
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(`\n📊 Resultado de migración:`);
  console.log(`   ✅ Migrados: ${migratedCount}`);
  console.log(`   ❌ Fallidos: ${failedCount}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errores durante migración:`);
    errors.forEach(({ index, error }) => {
      console.log(`   - Contexto ${index}: ${error}`);
    });
  }

  // ========================================
  // FASE 3: VERIFICACIÓN DE MIGRACIÓN
  // ========================================
  console.log("\n🔍 FASE 3: Verificando migración...");

  const newContextsCount = await db.context.count({
    where: { chatbotId: PRESERVED_CHATBOT_ID },
  });

  const embeddingsCount = await db.embedding.count({
    where: { chatbotId: PRESERVED_CHATBOT_ID },
  });

  console.log(`   Contextos en nuevo sistema: ${newContextsCount}`);
  console.log(`   Embeddings generados: ${embeddingsCount}`);

  if (newContextsCount === 0) {
    throw new Error("❌ No se crearon contextos en el nuevo sistema. Abortando.");
  }

  console.log(`   ✅ Migración verificada\n`);

  // ========================================
  // FASE 4: LIMPIEZA DEL CAMPO LEGACY
  // ========================================
  console.log("🧹 FASE 4: Limpiando campo legacy contexts[]...");

  await db.chatbot.update({
    where: { id: PRESERVED_CHATBOT_ID },
    data: { contexts: [] },
  });

  console.log(`   ✅ Campo contexts[] vaciado\n`);

  // ========================================
  // FASE 5: ELIMINACIÓN MASIVA
  // ========================================
  console.log("⚠️  FASE 5: Eliminando chatbots de otros usuarios...");
  console.log(`   PRESERVANDO: Usuario ${PRESERVED_USER_ID}, Chatbot ${PRESERVED_CHATBOT_ID}`);

  // Contar antes de eliminar
  const totalChatbotsBefore = await db.chatbot.count();
  const totalConversationsBefore = await db.conversation.count();
  const totalMessagesBefore = await db.message.count();

  console.log(`\n📊 Estado ANTES de eliminar:`);
  console.log(`   Total chatbots: ${totalChatbotsBefore}`);
  console.log(`   Total conversaciones: ${totalConversationsBefore}`);
  console.log(`   Total mensajes: ${totalMessagesBefore}`);

  // PRIMERO: Eliminar registros que NO tienen onDelete: Cascade
  // (Integration, Contact, Lead no tienen CASCADE configurado)
  console.log(`\n   Eliminando registros sin CASCADE automático...`);

  const deletedIntegrations = await db.integration.deleteMany({
    where: {
      chatbot: {
        AND: [
          { userId: { not: PRESERVED_USER_ID } },
          { id: { not: PRESERVED_CHATBOT_ID } },
        ],
      },
    },
  });
  console.log(`   ✅ Integraciones eliminadas: ${deletedIntegrations.count}`);

  const deletedContacts = await db.contact.deleteMany({
    where: {
      chatbot: {
        AND: [
          { userId: { not: PRESERVED_USER_ID } },
          { id: { not: PRESERVED_CHATBOT_ID } },
        ],
      },
    },
  });
  console.log(`   ✅ Contactos eliminados: ${deletedContacts.count}`);

  const deletedLeads = await db.lead.deleteMany({
    where: {
      chatbot: {
        AND: [
          { userId: { not: PRESERVED_USER_ID } },
          { id: { not: PRESERVED_CHATBOT_ID } },
        ],
      },
    },
  });
  console.log(`   ✅ Leads eliminados: ${deletedLeads.count}`);

  // SEGUNDO: Eliminar chatbots que NO sean del usuario preservado
  // CASCADE automático eliminará: Context, Embedding, Conversation, Message, Contact, Lead, etc.
  const deletedChatbots = await db.chatbot.deleteMany({
    where: {
      AND: [
        { userId: { not: PRESERVED_USER_ID } },
        { id: { not: PRESERVED_CHATBOT_ID } },
      ],
    },
  });

  console.log(`\n   ✅ Chatbots eliminados: ${deletedChatbots.count}`);

  // Limpiar registros huérfanos
  console.log(`\n🧹 Limpiando registros huérfanos...`);

  const deletedPermissions = await db.permission.deleteMany({
    where: {
      chatbotId: {
        not: PRESERVED_CHATBOT_ID,
      },
    },
  });

  const deletedParsingJobs = await db.parsingJob.deleteMany({
    where: {
      userId: { not: PRESERVED_USER_ID },
    },
  });

  console.log(`   ✅ Permissions eliminados: ${deletedPermissions.count}`);
  console.log(`   ✅ ParsingJobs eliminados: ${deletedParsingJobs.count}`);

  // ========================================
  // FASE 6: VERIFICACIÓN FINAL
  // ========================================
  console.log("\n🔍 FASE 6: Verificación final...");

  const totalChatbotsAfter = await db.chatbot.count();
  const totalConversationsAfter = await db.conversation.count();
  const totalMessagesAfter = await db.message.count();
  const totalContextsAfter = await db.context.count();
  const totalEmbeddingsAfter = await db.embedding.count();
  const totalContactsAfter = await db.contact.count();
  const totalLeadsAfter = await db.lead.count();

  console.log(`\n📊 Estado DESPUÉS de eliminar:`);
  console.log(`   Chatbots: ${totalChatbotsAfter}`);
  console.log(`   Conversaciones: ${totalConversationsAfter}`);
  console.log(`   Mensajes: ${totalMessagesAfter}`);
  console.log(`   Contextos (nuevo sistema): ${totalContextsAfter}`);
  console.log(`   Embeddings: ${totalEmbeddingsAfter}`);
  console.log(`   Contactos: ${totalContactsAfter}`);
  console.log(`   Leads: ${totalLeadsAfter}`);

  // Verificar que solo quede 1 chatbot
  if (totalChatbotsAfter !== 1) {
    console.warn(`\n⚠️  ADVERTENCIA: Se esperaba 1 chatbot, pero hay ${totalChatbotsAfter}`);
  }

  // Verificar que el chatbot preservado existe
  const preservedChatbot = await db.chatbot.findUnique({
    where: { id: PRESERVED_CHATBOT_ID },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
      contexts: true,
      contextObjects: true,
    },
  });

  if (!preservedChatbot) {
    throw new Error(`❌ ERROR CRÍTICO: Chatbot preservado ${PRESERVED_CHATBOT_ID} fue eliminado`);
  }

  console.log(`\n✅ Chatbot preservado:`);
  console.log(`   ID: ${preservedChatbot.id}`);
  console.log(`   Slug: ${preservedChatbot.slug}`);
  console.log(`   Nombre: ${preservedChatbot.name}`);
  console.log(`   Usuario: ${preservedChatbot.userId}`);
  console.log(`   Contextos legacy: ${preservedChatbot.contexts.length} (debe ser 0)`);
  console.log(`   Contextos nuevos: ${preservedChatbot.contextObjects.length}`);

  console.log(`\n🎉 SCRIPT COMPLETADO EXITOSAMENTE`);
  console.log(`\n📋 Resumen:`);
  console.log(`   - Contextos migrados: ${migratedCount}`);
  console.log(`   - Chatbots eliminados: ${deletedChatbots.count}`);
  console.log(`   - Conversaciones eliminadas: ~${totalConversationsBefore - totalConversationsAfter}`);
  console.log(`   - Mensajes eliminados: ~${totalMessagesBefore - totalMessagesAfter}`);
  console.log(`   - Backup guardado en: ${backupPath}`);
}

main()
  .catch((error) => {
    console.error("\n❌ ERROR FATAL:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
