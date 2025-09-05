import { Plans, type User } from "@prisma/client";
import { db } from "~/utils/db.server";
import { PLAN_LIMITS } from "./planLimits.server";

/**
 * Validates if a user can access chatbot creation features based on their plan
 */
export async function validateChatbotCreationAccess(userId: string): Promise<{
  canCreate: boolean;
  currentOwnedCount: number;
  maxAllowed: number;
  isPro: boolean;
  plan: Plans;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  // Count only OWNED chatbots (not shared ones)
  const ownedChatbots = await db.chatbot.findMany({
    where: {
      userId: userId,
      status: { not: "DELETED" },
    },
  });

  const planLimits = PLAN_LIMITS[user.plan];
  const currentOwnedCount = ownedChatbots.length;
  const maxAllowed = planLimits.maxChatbots;
  const isPro = user.plan === Plans.PRO;

  return {
    canCreate: currentOwnedCount < maxAllowed || maxAllowed === Infinity,
    currentOwnedCount,
    maxAllowed,
    isPro,
    plan: user.plan,
  };
}

/**
 * Validates if a user can access a specific chatbot
 * Differentiates between owned chatbots (subject to plan limits) and shared chatbots (not subject to limits)
 */
export async function validateChatbotAccess(
  userId: string,
  chatbotId: string
): Promise<{
  canAccess: boolean;
  isOwner: boolean;
  isShared: boolean;
  userRole?: string;
  restrictionReason?: string;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, plan: true, email: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  // Check if user owns the chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { id: true, userId: true, status: true },
  });

  if (!chatbot) {
    return {
      canAccess: false,
      isOwner: false,
      isShared: false,
      restrictionReason: "Chatbot no encontrado",
    };
  }

  const isOwner = chatbot.userId === userId;

  if (isOwner) {
    // For owned chatbots, apply plan restrictions based on PLAN_LIMITS
    const planLimits = PLAN_LIMITS[user.plan];
    
    if (planLimits.maxChatbots === 0) {
      // FREE users cannot access any owned chatbots
      return {
        canAccess: false,
        isOwner: true,
        isShared: false,
        restrictionReason: "Tu plan gratuito no incluye acceso a chatbots. Actualiza tu plan para usar esta funcionalidad.",
      };
    }

    // For other plans (STARTER, PRO, ENTERPRISE), they can access their chatbots
    return {
      canAccess: true,
      isOwner: true,
      isShared: false,
    };
  }

  // Check if user has permission to access shared chatbot (any plan can access shared chatbots)
  const permission = await db.permission.findFirst({
    where: {
      email: user.email,
      chatbotId: chatbotId,
      resourceType: "CHATBOT",
      status: "active",
    },
  });

  if (permission) {
    return {
      canAccess: true,
      isOwner: false,
      isShared: true,
      userRole: permission.role,
    };
  }

  return {
    canAccess: false,
    isOwner: false,
    isShared: false,
    restrictionReason: "Sin permisos para acceder a este chatbot",
  };
}

/**
 * Gets comprehensive chatbot access info for UI components
 */
export async function getChatbotAccessInfo(userId: string) {
  const creationAccess = await validateChatbotCreationAccess(userId);
  
  return {
    creation: creationAccess,
    showProTag: !creationAccess.canCreate && !creationAccess.isPro,
    proTagMessage: !creationAccess.canCreate 
      ? `Tu plan gratuito tiene un límite de ${creationAccess.maxAllowed} chatbot${creationAccess.maxAllowed === 0 || creationAccess.maxAllowed > 1 ? 's' : ''}. Actualiza tu plan para crear chatbots ilimitados.`
      : undefined,
  };
}