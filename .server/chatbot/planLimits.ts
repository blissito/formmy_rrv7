import { Plans } from "@prisma/client";
import { db } from "~/utils/db.server";

// Define los límites por plan
export const PLAN_LIMITS = {
  [Plans.FREE]: {
    maxChatbots: 1,
    maxContextSizeKB: 1000, // 1MB
    availableModels: [
      "mistralai/mistral-small-3.2-24b-instruct",
      "gpt-4o-mini",
    ],
    showBranding: true,
  },
  [Plans.PRO]: {
    maxChatbots: Infinity,
    maxContextSizeKB: 10000, // 10MB
    availableModels: [
      "mistralai/mistral-small-3.2-24b-instruct",
      "mistralai/mistral-medium-3.2-24b-instruct",
      "anthropic/claude-3-haiku-20240307",
      "anthropic/claude-3-sonnet-20240229",
    ],
    showBranding: false,
  },
};

/**
 * Valida si un usuario puede crear más chatbots según su plan
 */
export async function validateChatbotLimit(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  // Obtener el número actual de chatbots del usuario
  const chatbotCount = await db.chatbot.count({
    where: { userId },
  });

  const maxAllowed = PLAN_LIMITS[user.plan].maxChatbots;
  const canCreate = chatbotCount < maxAllowed;

  return {
    canCreate,
    currentCount: chatbotCount,
    maxAllowed,
  };
}

/**
 * Valida si un modelo de IA está disponible para el plan del usuario
 */
export async function validateAvailableModel(
  userId: string,
  modelName: string
): Promise<{
  isAvailable: boolean;
  availableModels: string[];
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const availableModels = PLAN_LIMITS[user.plan].availableModels;
  const isAvailable = availableModels.includes(modelName);

  return {
    isAvailable,
    availableModels,
  };
}

/**
 * Verifica si se debe mostrar el branding de Formmy según el plan
 */
export async function shouldShowBranding(userId: string): Promise<boolean> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  return PLAN_LIMITS[user.plan].showBranding;
}

/**
 * Valida si un usuario puede agregar más contexto según su plan
 */
export async function validateContextSizeLimit(
  userId: string,
  currentSizeKB: number,
  additionalSizeKB: number
): Promise<{
  canAdd: boolean;
  currentSize: number;
  maxAllowed: number;
  remainingSize: number;
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const maxAllowed = PLAN_LIMITS[user.plan].maxContextSizeKB;
  const newSize = currentSizeKB + additionalSizeKB;
  const canAdd = newSize <= maxAllowed;
  const remainingSize = Math.max(0, maxAllowed - currentSizeKB);

  return {
    canAdd,
    currentSize: currentSizeKB,
    maxAllowed,
    remainingSize,
  };
}

/**
 * Obtiene todos los límites del plan de un usuario
 */
export async function getUserPlanLimits(userId: string): Promise<{
  plan: Plans;
  limits: (typeof PLAN_LIMITS)[Plans];
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  return {
    plan: user.plan,
    limits: PLAN_LIMITS[user.plan],
  };
}
