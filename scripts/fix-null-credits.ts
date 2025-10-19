import { db } from "~/utils/db.server";

async function fixNullCredits() {
  console.log("🔧 Buscando y actualizando usuarios con creditsResetAt null...\n");

  try {
    // Usar MongoDB raw command para encontrar usuarios con creditsResetAt null
    const usersWithNull: any = await db.$runCommandRaw({
      find: "User",
      filter: { creditsResetAt: null },
    });

    const users = usersWithNull.cursor.firstBatch;
    console.log(`📊 Encontrados ${users.length} usuarios con creditsResetAt null`);

    if (users.length === 0) {
      console.log("✅ No hay usuarios que actualizar");
      process.exit(0);
      return;
    }

    // Actualizar cada usuario individualmente usando su createdAt
    let updated = 0;
    for (const userData of users) {
      // ObjectID viene como objeto MongoDB, necesitamos el string hex
      const userId = userData._id.$oid || userData._id.toString();

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true },
      });

      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: {
            creditsResetAt: user.createdAt,
            toolCreditsUsed: 0,
          },
        });
        console.log(`✅ Actualizado: ${user.email}`);
        updated++;
      }
    }

    console.log(`\n🎉 Total actualizado: ${updated} usuarios`);

    // Verificación final
    const verification: any = await db.$runCommandRaw({
      find: "User",
      filter: { creditsResetAt: null },
      limit: 1,
    });

    const remaining = verification.cursor.firstBatch.length;
    console.log(`\n📊 Verificación final: ${remaining} usuarios con creditsResetAt null`);

    if (remaining === 0) {
      console.log("✅ Todos los usuarios han sido migrados correctamente");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixNullCredits();
