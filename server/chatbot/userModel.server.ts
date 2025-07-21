import { Plans } from "@prisma/client";
import { db } from "~/utils/db.server";
import { PLAN_LIMITS } from "./planLimits.server";

/**
 * Gets a user by ID with chatbot information
 */
export async function getUserWithChatbots(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      chatbots: true,
    },
  });
}

/**
 * Gets all chatbots for a user with plan validation
 */
export async function getUserChatbotsWithPlanInfo(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      chatbots: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const planLimits = PLAN_LIMITS[user.plan];

  return {
    chatbots: user.chatbots,
    plan: user.plan,
    limits: {
      maxChatbots: planLimits.maxChatbots,
      currentCount: user.chatbots.length,
      canCreateMore:
        user.chatbots.length < planLimits.maxChatbots ||
        planLimits.maxChatbots === Infinity,
      availableModels: planLimits.availableModels,
      showBranding: planLimits.showBranding,
    },
  };
}

/**
 * Updates a user's plan
 */
export async function updateUserPlan(userId: string, plan: Plans) {
  return db.user.update({
    where: { id: userId },
    data: { plan },
  });
}

/**
 * Validates if a user can access specific chatbot features based on their plan
 */
export async function validateUserChatbotFeatures(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const planLimits = PLAN_LIMITS[user.plan];

  return {
    plan: user.plan,
    features: {
      availableModels: planLimits.availableModels,
      showBranding: planLimits.showBranding,
      maxContextSizeKB: planLimits.maxContextSizeKB,
      maxConversationsPerMonth: planLimits.maxConversationsPerMonth,
    },
  };
}

/**
 * Checks if a user has access to a specific AI model based on their plan
 */
export async function canUserAccessModel(
  userId: string,
  modelName: string
): Promise<boolean> {
  const validation = await validateAvailableModel(userId, modelName);
  return validation.isAvailable;
}

/**
 * Validates if a user can use advanced AI models based on their plan
 * Requirement 7.3: WHEN soy usuario FREE THEN el sistema SHALL limitar modelos de IA disponibles
 */
export async function validateUserAIModelAccess(userId: string): Promise<{
  canUseAdvancedModels: boolean;
  availableModels: string[];
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const planLimits = PLAN_LIMITS[user.plan];
  const canUseAdvancedModels = user.plan === Plans.PRO;

  return {
    canUseAdvancedModels,
    availableModels: planLimits.availableModels,
  };
}

/**
 * Gets all plan-specific features for a user
 * Covers requirements 7.3, 7.4, 7.5 related to plan-specific features
 */
export async function getUserPlanFeatures(userId: string): Promise<{
  plan: Plans;
  isPro: boolean;
  features: {
    availableModels: string[];
    showBranding: boolean;
    maxContextSizeKB: number;
    maxChatbots: number;
    maxConversationsPerMonth: number;
  };
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const planLimits = PLAN_LIMITS[user.plan];
  const isPro = user.plan === Plans.PRO;

  return {
    plan: user.plan,
    isPro,
    features: {
      availableModels: planLimits.availableModels,
      showBranding: planLimits.showBranding,
      maxContextSizeKB: planLimits.maxContextSizeKB,
      maxChatbots: planLimits.maxChatbots,
      maxConversationsPerMonth: planLimits.maxConversationsPerMonth,
    },
  };
}

/**
 * Validates if a user can create a new chatbot based on their plan limit
 * Requirement 1.1: WHEN un usuario FREE crea un chatbot THEN el sistema SHALL permitir solo un chatbot activo por usuario
 * Requirement 1.2: WHEN un usuario PRO crea chatbots THEN el sistema SHALL permitir múltiples chatbots sin límite específico
 */
export async function validateUserChatbotCreation(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
  isPro: boolean;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      chatbots: {
        where: {
          status: {
            not: "DELETED",
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const planLimits = PLAN_LIMITS[user.plan];
  const currentCount = user.chatbots.length;
  const maxAllowed = planLimits.maxChatbots;
  const isPro = user.plan === Plans.PRO;

  return {
    canCreate: currentCount < maxAllowed || maxAllowed === Infinity,
    currentCount,
    maxAllowed,
    isPro,
  };
}
