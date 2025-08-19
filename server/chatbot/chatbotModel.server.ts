import { ChatbotStatus, Plans } from "@prisma/client";
import type { Chatbot, ContextItem } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "~/utils/db.server";
import {
  validateChatbotLimit,
  validateAvailableModel,
  isUserInTrial,
} from "./planLimits.server";
import { validateContextSizeLimit } from "./planLimits.server";
import {
  changeChatbotState,
  markChatbotAsDeleted,
} from "./chatbotStateManager.server";

/**
 * Creates a new chatbot with basic fields
 */
export async function createChatbot({
  name,
  description,
  userId,
  personality,
  welcomeMessage,
  aiModel,
  primaryColor,
  theme,
  temperature = 0.7,
  instructions,
}: {
  name: string;
  description?: string;
  userId: string;
  personality?: string;
  welcomeMessage?: string;
  aiModel?: string;
  primaryColor?: string;
  theme?: string;
  temperature?: number;
  instructions?: string;
}): Promise<Chatbot> {
  // Validar límite de chatbots por usuario
  const limitValidation = await validateChatbotLimit(userId);
  if (!limitValidation.canCreate) {
    throw new Error(
      `Has alcanzado el límite de ${limitValidation.maxAllowed} chatbots para tu plan actual.`
    );
  }

  // Obtener información del usuario y trial
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const { inTrial } = await isUserInTrial(userId);
  
  // Determinar el modelo según el plan del usuario
  let finalAiModel = aiModel;
  
  // Si es FREE sin trial, el modelo debe ser null
  if (user.plan === Plans.FREE && !inTrial) {
    finalAiModel = null;
  } else if (finalAiModel) {
    // Solo validar el modelo si no es null
    const modelValidation = await validateAvailableModel(userId, finalAiModel);
    if (!modelValidation.isAvailable) {
      throw new Error(
        `El modelo ${finalAiModel} no está disponible en tu plan actual. Modelos disponibles: ${modelValidation.availableModels.join(
          ", "
        )}`
      );
    }
  }

  // Generate a unique slug based on the name
  const slug = generateUniqueSlug(name);

  return db.chatbot.create({
    data: {
      name,
      description,
      slug,
      userId,
      personality,
      welcomeMessage,
      aiModel: finalAiModel,
      primaryColor,
      theme,
      temperature,
      instructions,
      status: ChatbotStatus.DRAFT,
      isActive: false,
      conversationCount: 0,
      monthlyUsage: 0,
      contextSizeKB: 0,
      contexts: [], // Initialize with empty contexts
    },
  });
}

/**
 * Updates an existing chatbot
 */
export async function updateChatbot(
  id: string,
  data: Partial<Omit<Chatbot, "id" | "slug" | "userId" | "createdAt" | "updatedAt">>
): Promise<Chatbot> {
  // Si se está actualizando el modelo de IA, validar que esté disponible para el plan
  if (data.aiModel) {
    const chatbot = await db.chatbot.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!chatbot) {
      throw new Error(`Chatbot with ID ${id} not found`);
    }

    const modelValidation = await validateAvailableModel(
      chatbot.userId,
      data.aiModel
    );

    if (!modelValidation.isAvailable) {
      throw new Error(
        `El modelo ${data.aiModel} no está disponible en tu plan actual. ` +
          `Modelos disponibles: ${modelValidation.availableModels.join(", ")}`
      );
    }
  }

  return db.chatbot.update({
    where: { id },
    data,
  });
}

/**
 * Adds a context item to a chatbot
 */
export async function addContextItem(
  chatbotId: string,
  contextItem: Omit<ContextItem, "id" | "createdAt">
): Promise<Chatbot> {
  // Get the current chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: { user: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Validar límite de tamaño de contexto
  const sizeValidation = await validateContextSizeLimit(
    chatbot.userId,
    chatbot.contextSizeKB,
    contextItem.sizeKB || 0
  );

  if (!sizeValidation.canAdd) {
    throw new Error(
      `Has alcanzado el límite de ${sizeValidation.maxAllowed}KB para contextos en tu plan actual. ` +
        `Espacio disponible: ${sizeValidation.remainingSize}KB.`
    );
  }

  // Create a new context item with ID and createdAt
  const newContextItem: ContextItem = {
    ...contextItem,
    id: nanoid(),
    createdAt: new Date(),
  };


  // Parse the existing contexts or initialize as empty array
  let existingContexts = Array.isArray(chatbot.contexts)
    ? chatbot.contexts
    : chatbot.contexts
    ? JSON.parse(JSON.stringify(chatbot.contexts))
    : [];

  // Migrar contextos existentes que no tienen el campo routes
  existingContexts = existingContexts.map((context: any) => ({
    ...context,
    routes: context.routes || [] // Agregar campo routes si no existe
  }));

  // Add the new context item to the chatbot's contexts
  return db.chatbot.update({
    where: { id: chatbotId },
    data: {
      contexts: [...existingContexts, newContextItem],
      // Update the context size if the new item has a size
      contextSizeKB: contextItem.sizeKB
        ? (chatbot.contextSizeKB || 0) + contextItem.sizeKB
        : chatbot.contextSizeKB || 0,
    },
  });
}

/**
 * Removes a context item from a chatbot
 */
export async function removeContextItem(
  chatbotId: string,
  contextItemId: string
): Promise<Chatbot> {
  // Get the current chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Parse the contexts JSON if it's a string, otherwise use as is
  const contexts = Array.isArray(chatbot.contexts)
    ? chatbot.contexts
    : chatbot.contexts
    ? JSON.parse(JSON.stringify(chatbot.contexts))
    : [];

  // Find the context item to remove
  const contextItem = contexts.find((item: any) => item.id === contextItemId);

  if (!contextItem) {
    throw new Error(`Context item with ID ${contextItemId} not found`);
  }

  // Remove the context item from the chatbot's contexts
  const updatedContexts = contexts.filter(
    (item: any) => item.id !== contextItemId
  );

  // Calculate new context size
  const newContextSizeKB = contextItem.sizeKB
    ? (chatbot.contextSizeKB || 0) - contextItem.sizeKB
    : chatbot.contextSizeKB || 0;

  // Update the chatbot with the new contexts and size
  return db.chatbot.update({
    where: { id: chatbotId },
    data: {
      contexts: updatedContexts,
      contextSizeKB: Math.max(0, newContextSizeKB), // Ensure we don't go below 0
    },
  });
}

/**
 * Updates the status of a chatbot
 * @deprecated Use chatbotStateManager functions instead
 */
export async function updateChatbotStatus(
  id: string,
  status: ChatbotStatus,
  isActive: boolean
): Promise<Chatbot> {
  return changeChatbotState(id, status);
}

/**
 * Increments the conversation count for a chatbot
 */
export async function incrementConversationCount(id: string): Promise<Chatbot> {
  return db.chatbot.update({
    where: { id },
    data: {
      conversationCount: {
        increment: 1,
      },
      monthlyUsage: {
        increment: 1,
      },
    },
  });
}

/**
 * Resets the monthly usage count for a chatbot
 */
export async function resetMonthlyUsage(id: string): Promise<Chatbot> {
  return db.chatbot.update({
    where: { id },
    data: {
      monthlyUsage: 0,
    },
  });
}

/**
 * Generates a unique slug based on the chatbot name
 */
function generateUniqueSlug(name: string): string {
  // Convert name to lowercase, replace spaces with hyphens, and remove special characters
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  // Add a random suffix to ensure uniqueness
  return `${baseSlug}-${nanoid(6)}`;
}

/**
 * Gets a chatbot by ID
 */
export async function getChatbotById(id: string): Promise<Chatbot | null> {
  return db.chatbot.findUnique({
    where: { id },
  });
}

/**
 * Gets a chatbot by slug
 */
export async function getChatbotBySlug(slug: string): Promise<Chatbot | null> {
  return db.chatbot.findUnique({
    where: { slug },
  });
}

/**
 * Gets all chatbots for a user
 */
export function getChatbotsByUserId(userId: string): Promise<Chatbot[]> {
  return db.chatbot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Deletes a chatbot
 */
export async function deleteChatbot(id: string): Promise<Chatbot> {
  return markChatbotAsDeleted(id);
}
