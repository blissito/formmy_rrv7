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
  let slug: string;
  let finalName = name;

  // Si el nombre es "Ghosty", generar un ID único y usarlo en nombre y slug
  if (name === "Ghosty") {
    const ghostyId = nanoid(6);
    finalName = `Ghosty ${ghostyId}`;
    slug = `ghosty_${ghostyId}`;
  } else {
    slug = generateUniqueSlug(name);
  }

  const chatbot = await db.chatbot.create({
    data: {
      name: finalName,
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
      status: ChatbotStatus.ACTIVE, // Chatbots creados directamente como ACTIVE
      isActive: true, // Chatbots creados como activos por defecto
      conversationCount: 0,
      monthlyUsage: 0,
      contextSizeKB: 0,
      // contextObjects se crea vacío automáticamente (relación, no campo JSON)
    },
  });

  // Marcar que el usuario ha creado su primer chatbot (bandera permanente para email noUsage)
  await db.user.update({
    where: { id: userId },
    data: { hasCreatedChatbot: true }
  });

  return chatbot;
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
 * @param chatbotId - ID del chatbot
 * @param contextItemId - ID del contexto a eliminar
 * @param userId - (Opcional) ID del usuario para validar ownership
 */
export async function removeContextItem(
  chatbotId: string,
  contextItemId: string,
  userId?: string
): Promise<Chatbot> {
  // 🔒 SECURITY: Validar ownership del chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  if (userId && chatbot.userId !== userId) {
    throw new Error(
      `Access denied: You don't own chatbot ${chatbotId}`
    );
  }

  // ✅ Buscar contexto en el modelo Context (sistema nuevo)
  const contextItem = await db.context.findFirst({
    where: {
      id: contextItemId,
      chatbotId,
    },
    select: {
      id: true,
      metadata: true,
    },
  });

  if (!contextItem) {
    throw new Error(`Context item with ID ${contextItemId} not found`);
  }

  // ✅ Eliminar embeddings y contexto usando deleteContext de vercel_embeddings
  try {
    const { deleteContext } = await import('../context/vercel_embeddings');
    const result = await deleteContext({
      contextId: contextItemId,
      chatbotId
    });

    if (!result.success) {
      throw result.error || new Error('Error desconocido al eliminar contexto');
    }

    console.log(`✅ [removeContextItem] Deleted context and embeddings for ${contextItemId}`);
  } catch (error) {
    console.error('❌ [removeContextItem] Failed to delete context:', error);
    throw new Error(
      `No se pudo eliminar el contexto. Error: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }

  // ✅ Retornar chatbot actualizado (sin tocar campo legacy contexts)
  const updatedChatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
  });

  if (!updatedChatbot) {
    throw new Error(`Failed to retrieve updated chatbot ${chatbotId}`);
  }

  return updatedChatbot;
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
