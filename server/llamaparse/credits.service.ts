import { db } from "~/utils/db.server";
import { PLAN_LIMITS } from "../chatbot/planLimits.server";

/**
 * Valida si el usuario tiene suficientes créditos y los descuenta
 * Lógica de uso: PRIMERO purchased credits (no caducan), LUEGO monthly credits
 * @throws Error si no hay créditos suficientes
 */
export async function validateAndDeduct(
  userId: string,
  credits: number
): Promise<{
  success: boolean;
  monthlyUsed: number;
  purchasedRemaining: number;
  monthlyRemaining: number;
  totalAvailable: number;
  usedFrom: "purchased" | "monthly" | "mixed";
}> {
  // 1. Obtener usuario
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      toolCreditsUsed: true,
      creditsResetAt: true,
      createdAt: true,
      purchasedCredits: true,
      lifetimeCreditsUsed: true,
    },
  });

  if (!user) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }

  // 2. Reset mensual si es necesario
  const now = new Date();
  const resetDate = user.creditsResetAt || user.createdAt;
  const resetMonth = new Date(resetDate).getMonth();
  const currentMonth = now.getMonth();
  const resetYear = new Date(resetDate).getFullYear();
  const currentYear = now.getFullYear();

  let currentMonthlyUsed = user.toolCreditsUsed;

  if (currentMonth !== resetMonth || currentYear !== resetYear || !user.creditsResetAt) {
    await db.user.update({
      where: { id: userId },
      data: {
        toolCreditsUsed: 0,
        creditsResetAt: now,
      },
    });
    currentMonthlyUsed = 0;
  }

  // 3. Calcular créditos disponibles
  const planLimit = PLAN_LIMITS[user.plan].toolCreditsPerMonth;
  const monthlyAvailable = planLimit - currentMonthlyUsed;
  const purchasedAvailable = user.purchasedCredits;
  const totalAvailable = purchasedAvailable + monthlyAvailable;

  if (credits > totalAvailable) {
    throw new Error(
      `Créditos insuficientes. Disponibles: ${totalAvailable} (${purchasedAvailable} comprados + ${monthlyAvailable} mensuales). Requeridos: ${credits}`
    );
  }

  // 4. Descontar créditos (PRIMERO purchased, LUEGO monthly)
  let creditsFromPurchased = 0;
  let creditsFromMonthly = 0;
  let usedFrom: "purchased" | "monthly" | "mixed";

  if (purchasedAvailable >= credits) {
    // Caso 1: Tenemos suficientes créditos comprados
    creditsFromPurchased = credits;
    usedFrom = "purchased";
  } else {
    // Caso 2: Usar todos los purchased + algunos monthly
    creditsFromPurchased = purchasedAvailable;
    creditsFromMonthly = credits - purchasedAvailable;
    usedFrom = purchasedAvailable > 0 ? "mixed" : "monthly";
  }

  // Actualizar atómicamente
  const updated = await db.user.update({
    where: { id: userId },
    data: {
      purchasedCredits: { decrement: creditsFromPurchased },
      toolCreditsUsed: { increment: creditsFromMonthly },
      lifetimeCreditsUsed: { increment: credits },
    },
    select: {
      purchasedCredits: true,
      toolCreditsUsed: true,
    },
  });

  // Double-check post-update
  const newMonthlyUsed = updated.toolCreditsUsed;
  const newPurchasedRemaining = updated.purchasedCredits;

  if (newMonthlyUsed > planLimit || newPurchasedRemaining < 0) {
    // Rollback
    await db.user.update({
      where: { id: userId },
      data: {
        purchasedCredits: { increment: creditsFromPurchased },
        toolCreditsUsed: { decrement: creditsFromMonthly },
        lifetimeCreditsUsed: { decrement: credits },
      },
    });
    throw new Error(
      `Error en validación post-update. Operación revertida.`
    );
  }

  return {
    success: true,
    monthlyUsed: newMonthlyUsed,
    purchasedRemaining: newPurchasedRemaining,
    monthlyRemaining: planLimit - newMonthlyUsed,
    totalAvailable: newPurchasedRemaining + (planLimit - newMonthlyUsed),
    usedFrom,
  };
}

/**
 * Obtiene los créditos disponibles de un usuario (purchased + monthly)
 */
export async function getAvailableCredits(userId: string): Promise<{
  planLimit: number;
  monthlyUsed: number;
  monthlyAvailable: number;
  purchasedCredits: number;
  totalAvailable: number;
  resetAt: Date;
  lifetimeUsed: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      toolCreditsUsed: true,
      creditsResetAt: true,
      createdAt: true,
      purchasedCredits: true,
      lifetimeCreditsUsed: true,
    },
  });

  if (!user) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }

  // Check si necesita reset
  const now = new Date();
  const resetDate = user.creditsResetAt || user.createdAt;
  const resetMonth = new Date(resetDate).getMonth();
  const currentMonth = now.getMonth();

  let monthlyUsed = user.toolCreditsUsed;
  let resetAt = resetDate;

  if (currentMonth !== resetMonth || !user.creditsResetAt) {
    monthlyUsed = 0;
    resetAt = now;
  }

  const planLimit = PLAN_LIMITS[user.plan].toolCreditsPerMonth;
  const monthlyAvailable = Math.max(0, planLimit - monthlyUsed);
  const purchasedCredits = user.purchasedCredits;
  const totalAvailable = purchasedCredits + monthlyAvailable;

  return {
    planLimit,
    monthlyUsed,
    monthlyAvailable,
    purchasedCredits,
    totalAvailable,
    resetAt,
    lifetimeUsed: user.lifetimeCreditsUsed,
  };
}

/**
 * Agregar créditos comprados a un usuario (one-time purchase, NO caducan)
 */
export async function addPurchasedCredits(
  userId: string,
  credits: number
): Promise<{
  success: boolean;
  newBalance: number;
}> {
  const updated = await db.user.update({
    where: { id: userId },
    data: {
      purchasedCredits: { increment: credits },
    },
    select: {
      purchasedCredits: true,
    },
  });

  return {
    success: true,
    newBalance: updated.purchasedCredits,
  };
}

/**
 * Wrapper para descontar créditos por uso de tools
 * Compatible con la interfaz legacy que incluye chatbotId y toolName
 */
export async function deductToolCredits({
  userId,
  chatbotId,
  toolName,
  credits,
}: {
  userId: string;
  chatbotId?: string;
  toolName: string;
  credits: number;
}): Promise<void> {
  await validateAndDeduct(userId, credits);
}
