import { db } from "~/utils/db.server";
import { PLAN_LIMITS } from "../chatbot/planLimits.server";

/**
 * Valida si el usuario tiene suficientes créditos y los descuenta
 * @throws Error si no hay créditos suficientes
 */
export async function validateAndDeduct(
  userId: string,
  credits: number
): Promise<{
  success: boolean;
  creditsUsed: number;
  creditsRemaining: number;
}> {
  // 1. Obtener usuario
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      toolCreditsUsed: true,
      creditsResetAt: true,
      createdAt: true, // Fallback si creditsResetAt es null
    },
  });

  if (!user) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }

  // 2. Reset mensual si es necesario
  const now = new Date();
  const resetDate = user.creditsResetAt || user.createdAt; // Fallback para usuarios existentes
  const resetMonth = new Date(resetDate).getMonth();
  const currentMonth = now.getMonth();
  const resetYear = new Date(resetDate).getFullYear();
  const currentYear = now.getFullYear();

  let currentCreditsUsed = user.toolCreditsUsed;

  // Resetear si es diferente mes O año O si creditsResetAt es null (primera vez)
  if (currentMonth !== resetMonth || currentYear !== resetYear || !user.creditsResetAt) {
    // Nuevo mes - resetear créditos
    await db.user.update({
      where: { id: userId },
      data: {
        toolCreditsUsed: 0,
        creditsResetAt: now,
      },
    });
    currentCreditsUsed = 0;
  }

  // 3. Validar límite del plan
  const planLimit = PLAN_LIMITS[user.plan].toolCreditsPerMonth;
  const creditsAvailable = planLimit - currentCreditsUsed;

  if (credits > creditsAvailable) {
    throw new Error(
      `Créditos insuficientes. Disponibles: ${creditsAvailable}, Requeridos: ${credits}. Límite del plan ${user.plan}: ${planLimit}/mes`
    );
  }

  // 4. Descontar créditos (RACE CONDITION FIX: Usar operación atómica)
  // MongoDB no soporta transacciones fácilmente, pero increment es atómico
  const updated = await db.user.update({
    where: { id: userId },
    data: {
      toolCreditsUsed: { increment: credits },
    },
    select: {
      toolCreditsUsed: true,
    },
  });

  const newCreditsUsed = updated.toolCreditsUsed;
  const creditsRemaining = planLimit - newCreditsUsed;

  // Double-check post-update (seguridad extra)
  if (newCreditsUsed > planLimit) {
    // Rollback - restar los créditos que agregamos
    await db.user.update({
      where: { id: userId },
      data: {
        toolCreditsUsed: { decrement: credits },
      },
    });
    throw new Error(
      `Créditos insuficientes detectado post-update. Operación revertida.`
    );
  }

  return {
    success: true,
    creditsUsed: newCreditsUsed,
    creditsRemaining,
  };
}

/**
 * Obtiene los créditos disponibles de un usuario
 */
export async function getAvailableCredits(userId: string): Promise<{
  planLimit: number;
  used: number;
  available: number;
  resetAt: Date;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      toolCreditsUsed: true,
      creditsResetAt: true,
      createdAt: true, // Fallback si creditsResetAt es null
    },
  });

  if (!user) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }

  // Check si necesita reset
  const now = new Date();
  const resetDate = user.creditsResetAt || user.createdAt; // Fallback para usuarios existentes
  const resetMonth = new Date(resetDate).getMonth();
  const currentMonth = now.getMonth();

  let used = user.toolCreditsUsed;
  let resetAt = resetDate;

  if (currentMonth !== resetMonth || !user.creditsResetAt) {
    // Ya pasó el mes, créditos reseteados
    used = 0;
    resetAt = now;
  }

  const planLimit = PLAN_LIMITS[user.plan].toolCreditsPerMonth;
  const available = Math.max(0, planLimit - used);

  return {
    planLimit,
    used,
    available,
    resetAt,
  };
}
