/**
 * Script para migrar contactos existentes sin status al valor por defecto "NEW"
 *
 * Uso:
 *   npx tsx scripts/migrate-contact-status.ts
 */

import { db } from "../app/utils/db.server";

async function migrateContactStatus() {
  console.log("🔄 Iniciando migración de status de contactos...");

  try {
    // Obtener todos los contactos
    const contacts = await db.contact.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    console.log(`📊 Total de contactos encontrados: ${contacts.length}`);

    // Filtrar contactos sin status (aunque no debería haber ninguno con el schema actual)
    const contactsWithoutStatus = contacts.filter((c) => !c.status);

    if (contactsWithoutStatus.length === 0) {
      console.log("✅ Todos los contactos ya tienen un status asignado");
      return;
    }

    console.log(`🔧 Actualizando ${contactsWithoutStatus.length} contactos...`);

    // Actualizar contactos en batch
    const updatePromises = contactsWithoutStatus.map((contact) =>
      db.contact.update({
        where: { id: contact.id },
        data: { status: "NEW" },
      })
    );

    await Promise.all(updatePromises);

    console.log(`✅ Migración completada: ${contactsWithoutStatus.length} contactos actualizados`);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Ejecutar migración
migrateContactStatus()
  .then(() => {
    console.log("🎉 Migración exitosa");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
