import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkUserStatus() {
  try {
    const user = await db.user.findFirst({
      where: { email: "fixtergeek@gmail.com" },
      select: {
        id: true,
        email: true,
        plan: true,
        createdAt: true,
        trialStartedAt: true,
        customerId: true,
        subscriptionIds: true
      },
    });

    if (!user) {
      console.log("❌ Usuario no encontrado");
      return;
    }

    console.log("\n📊 === ESTADO ACTUAL DEL USUARIO ===\n");
    console.log("📧 Email:", user.email);
    console.log("🎯 Plan actual:", user.plan);
    console.log("📅 Cuenta creada:", user.createdAt.toISOString());
    console.log("🔄 Trial iniciado:", user.trialStartedAt ? user.trialStartedAt.toISOString() : "No registrado (usa createdAt)");

    // Calcular días desde inicio
    const startDate = user.trialStartedAt || user.createdAt;
    const daysSince = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log("⏱️ Días desde inicio:", daysSince);

    if (user.plan === "TRIAL") {
      const daysRemaining = Math.max(0, 60 - daysSince);
      const isExpired = daysRemaining === 0;

      console.log("\n🔍 === ANÁLISIS DE TRIAL ===\n");
      console.log("📆 Días de trial usados:", daysSince, "/ 60");
      console.log("⏳ Días restantes:", daysRemaining);
      console.log("🚨 Trial expirado:", isExpired ? "SÍ ⚠️" : "NO ✅");

      if (isExpired) {
        console.log("\n⚠️ === PROBLEMA DETECTADO ===");
        console.log("Tu trial ha expirado. El sistema automáticamente:");
        console.log("1. Cambiará tu plan a FREE");
        console.log("2. Desactivará todos tus chatbots");
        console.log("3. Limitará tus formmys a solo 3");
        console.log("\n💡 SOLUCIÓN: Necesitas actualizar a un plan de pago");
      }
    }

    if (user.customerId || user.subscriptionIds) {
      console.log("\n💳 === INFORMACIÓN DE STRIPE ===\n");
      console.log("Customer ID:", user.customerId || "No tiene");
      console.log("Subscription IDs:", user.subscriptionIds || "No tiene");
    }

    await db.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await db.$disconnect();
  }
}

checkUserStatus();