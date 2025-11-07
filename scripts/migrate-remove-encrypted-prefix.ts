/**
 * Script: Remover prefijo "encrypted_" de tokens de WhatsApp
 *
 * Propósito: Limpiar el mock de encriptación que se quedó en producción
 * El prefijo "encrypted_" NO provee seguridad real y causa bugs (Error 190 de Meta)
 *
 * Uso:
 *   npx tsx scripts/migrate-remove-encrypted-prefix.ts
 *
 * IMPORTANTE: Ejecutar UNA SOLA VEZ en producción ANTES del deploy
 */

import { db } from "~/utils/db.server";

async function migrateTokens() {
  console.log("🔧 Iniciando migración: Remover prefijo 'encrypted_' de tokens de WhatsApp\n");

  // 1. Buscar todas las integraciones de WhatsApp con prefijo
  const integrations = await db.integration.findMany({
    where: {
      platform: "WHATSAPP",
      token: {
        startsWith: "encrypted_"
      }
    },
    select: {
      id: true,
      token: true,
      chatbotId: true,
      phoneNumberId: true,
    }
  });

  if (integrations.length === 0) {
    console.log("✅ No hay tokens con prefijo 'encrypted_' - Migración no necesaria");
    return;
  }

  console.log(`📋 Encontradas ${integrations.length} integraciones con prefijo 'encrypted_':\n`);

  // 2. Remover prefijo de cada token
  let successCount = 0;
  let errorCount = 0;

  for (const integration of integrations) {
    const oldToken = integration.token || "";
    const newToken = oldToken.replace("encrypted_", "");

    console.log(`🔄 Procesando integración ${integration.id}:`);
    console.log(`   Chatbot: ${integration.chatbotId}`);
    console.log(`   Phone: ${integration.phoneNumberId || 'N/A'}`);
    console.log(`   Token: ${oldToken.substring(0, 20)}... (${oldToken.length} chars)`);
    console.log(`   → ${newToken.substring(0, 20)}... (${newToken.length} chars)`);

    try {
      await db.integration.update({
        where: { id: integration.id },
        data: { token: newToken }
      });

      successCount++;
      console.log(`   ✅ Actualizado exitosamente\n`);
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error al actualizar:`, error);
      console.log();
    }
  }

  // 3. Reporte final
  console.log("═".repeat(60));
  console.log("📊 RESUMEN DE MIGRACIÓN");
  console.log("═".repeat(60));
  console.log(`Total encontradas:  ${integrations.length}`);
  console.log(`✅ Actualizadas:    ${successCount}`);
  console.log(`❌ Errores:         ${errorCount}`);
  console.log("═".repeat(60));

  if (errorCount > 0) {
    console.error("\n⚠️  Algunos tokens NO se pudieron actualizar. Revisar logs arriba.");
    process.exit(1);
  } else {
    console.log("\n🎉 Migración completada exitosamente!");
    console.log("\n💡 Próximos pasos:");
    console.log("   1. Deploy del código actualizado (sin encryptText)");
    console.log("   2. Probar que el bot responde a mensajes de WhatsApp");
    console.log("   3. Verificar logs en Fly.io (no debe haber error 190)\n");
  }
}

// Ejecutar migración
migrateTokens()
  .catch((error) => {
    console.error("\n❌ Error fatal durante migración:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
