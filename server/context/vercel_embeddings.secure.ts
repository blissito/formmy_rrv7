/**
 * 🔒 SECURE WRAPPER para vercel_embeddings.ts
 *
 * Este módulo provee wrappers seguros con validación de ownership para todas
 * las operaciones de vectorización con Vercel AI SDK.
 *
 * IMPORTANTE: SIEMPRE usar estas funciones en lugar de las originales de vercel_embeddings.ts
 *
 * Validaciones implementadas:
 * - Ownership del chatbot (userId debe ser owner)
 * - Formato válido de ObjectIds
 * - Context pertenece al chatbot correcto
 * - Defensa en profundidad (múltiples capas)
 */

import { db } from "~/utils/db.server";
import {
  upsert,
  updateContext,
  deleteContext,
  vectorSearch,
  type ContextMetadata,
} from "./vercel_embeddings";

/**
 * Valida que el usuario sea owner del chatbot
 * @throws Error si el chatbot no existe o el usuario no es owner
 */
async function validateChatbotOwnership(
  chatbotId: string,
  userId: string
): Promise<void> {
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot ${chatbotId} no encontrado`);
  }

  if (chatbot.userId !== userId) {
    throw new Error(`Acceso denegado al chatbot ${chatbotId}`);
  }
}

/**
 * Valida formato de ObjectId de MongoDB
 * @throws Error si el formato es inválido
 */
function validateObjectId(id: string, fieldName: string): void {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error(`${fieldName} inválido: ${id}`);
  }
}

/**
 * Wrapper seguro para upsert() con validación de ownership
 */
export async function secureUpsert(params: {
  chatbotId: string;
  title: string;
  content: string;
  userId: string; // 🔒 REQUERIDO para validación
  metadata?: ContextMetadata;
}) {
  // 🔒 VALIDAR FORMATO DE IDS
  validateObjectId(params.chatbotId, "chatbotId");

  // 🔒 VALIDAR OWNERSHIP
  await validateChatbotOwnership(params.chatbotId, params.userId);

  // ✅ SAFE: Llamar función original después de validaciones
  return await upsert({
    chatbotId: params.chatbotId,
    title: params.title,
    content: params.content,
    metadata: params.metadata,
  });
}

/**
 * Wrapper seguro para updateContext() con validación de ownership
 */
export async function secureUpdateContext(params: {
  contextId: string;
  chatbotId: string;
  title: string;
  content: string;
  userId: string; // 🔒 REQUERIDO
}) {
  // 🔒 VALIDAR FORMATO DE IDS
  validateObjectId(params.contextId, "contextId");
  validateObjectId(params.chatbotId, "chatbotId");

  // 🔒 VALIDAR OWNERSHIP DEL CHATBOT
  await validateChatbotOwnership(params.chatbotId, params.userId);

  // 🔒 VALIDAR QUE EL CONTEXT PERTENECE AL CHATBOT
  const context = await db.context.findFirst({
    where: {
      id: params.contextId,
      chatbotId: params.chatbotId,
    },
  });

  if (!context) {
    throw new Error(
      `Context ${params.contextId} no pertenece al chatbot ${params.chatbotId}`
    );
  }

  // ✅ SAFE: Llamar función original
  return await updateContext({
    contextId: params.contextId,
    chatbotId: params.chatbotId,
    title: params.title,
    content: params.content,
  });
}

/**
 * Wrapper seguro para deleteContext() con validación de ownership
 */
export async function secureDeleteContext(params: {
  contextId: string;
  chatbotId: string;
  userId: string; // 🔒 REQUERIDO
}) {
  // 🔒 VALIDAR FORMATO DE IDS
  validateObjectId(params.contextId, "contextId");
  validateObjectId(params.chatbotId, "chatbotId");

  // 🔒 VALIDAR OWNERSHIP DEL CHATBOT
  await validateChatbotOwnership(params.chatbotId, params.userId);

  // 🔒 VALIDAR QUE EL CONTEXT PERTENECE AL CHATBOT
  const context = await db.context.findFirst({
    where: {
      id: params.contextId,
      chatbotId: params.chatbotId,
    },
  });

  if (!context) {
    throw new Error(
      `Context ${params.contextId} no pertenece al chatbot ${params.chatbotId}`
    );
  }

  // ✅ SAFE: Llamar función original
  return await deleteContext({
    contextId: params.contextId,
    chatbotId: params.chatbotId,
  });
}

/**
 * Wrapper seguro para vectorSearch()
 *
 * NOTA: vectorSearch() YA filtra por chatbotId internamente en MongoDB,
 * por lo que solo necesitamos validar el formato del ID.
 *
 * El filtro `{ chatbotId: { $oid: chatbotId } }` se aplica en la query de MongoDB
 * garantizando aislamiento de datos a nivel de motor de base de datos.
 */
export async function secureVectorSearch(params: {
  query: string;
  chatbotId: string;
  topK?: number;
}) {
  // 🔒 VALIDAR FORMATO DEL ID
  validateObjectId(params.chatbotId, "chatbotId");

  // ✅ SAFE: vectorSearch aplica filtro por chatbotId en MongoDB
  return await vectorSearch({
    chatbotId: params.chatbotId,
    value: params.query,
    topK: params.topK,
  });
}
