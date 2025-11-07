/**
 * Migración: Agregar unique constraint a DebouncedMessage
 *
 * Crea índice único en (messageId + phoneNumberId + type) para prevenir
 * race conditions en debouncing de mensajes de WhatsApp.
 */

import { db } from "../app/utils/db.server";

async function migrate() {
  try {
    console.log("🚀 [Migration] Creando índice único en DebouncedMessage...");

    // MongoDB: Crear índice único manualmente
    // @ts-ignore - MongoDB native operations
    const collection = db.debouncedMessage.fields;

    // Intentar crear el índice único
    try {
      // @ts-ignore
      await (db.debouncedMessage as any).createIndex(
        { messageId: 1, phoneNumberId: 1, type: 1 },
        { unique: true, name: "DebouncedMessage_messageId_phoneNumberId_type_key" }
      );
      console.log("✅ [Migration] Índice único creado exitosamente");
    } catch (indexError: any) {
      if (indexError.code === 85) {
        console.log("ℹ️ [Migration] Índice único ya existe");
      } else {
        throw indexError;
      }
    }

    // Limpiar registros duplicados existentes (mantener el más reciente)
    console.log("🧹 [Migration] Limpiando registros duplicados...");

    const duplicates = await db.debouncedMessage.groupBy({
      by: ['messageId', 'phoneNumberId', 'type'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`📊 [Migration] Encontrados ${duplicates.length} grupos con duplicados`);

    for (const dup of duplicates) {
      // Obtener todos los registros del grupo
      const records = await db.debouncedMessage.findMany({
        where: {
          messageId: dup.messageId,
          phoneNumberId: dup.phoneNumberId,
          type: dup.type as 'message' | 'echo',
        },
        orderBy: {
          processedAt: 'desc',
        },
      });

      // Mantener el más reciente, eliminar los demás
      const [keep, ...remove] = records;

      if (remove.length > 0) {
        await db.debouncedMessage.deleteMany({
          where: {
            id: {
              in: remove.map(r => r.id),
            },
          },
        });
        console.log(`🗑️ [Migration] Eliminados ${remove.length} duplicados de ${dup.messageId}`);
      }
    }

    console.log("✅ [Migration] Migración completada exitosamente");
  } catch (error) {
    console.error("❌ [Migration] Error durante migración:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

migrate();
