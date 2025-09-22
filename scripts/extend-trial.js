import { PrismaClient, Plans } from "@prisma/client";

const db = new PrismaClient();

async function extendTrial() {
  try {
    // Actualizar usuario a TRIAL con fecha de inicio renovada
    const user = await db.user.update({
      where: { email: "fixtergeek@gmail.com" },
      data: {
        plan: Plans.TRIAL,
        trialStartedAt: new Date() // Reinicia el contador de 60 días
      }
    });

    console.log("✅ Trial extendido exitosamente");
    console.log("📧 Email:", user.email);
    console.log("🎯 Plan:", user.plan);
    console.log("📅 Trial renovado hasta:", new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString());

    await db.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await db.$disconnect();
  }
}

extendTrial();