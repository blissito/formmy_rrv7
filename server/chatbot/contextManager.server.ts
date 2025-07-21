import { ContextType } from "@prisma/client";
import type { ContextItem } from "@prisma/client";
import { addContextItem } from "./chatbotModel.server";
import {
  validateFileContext,
  validateUrlContext,
} from "./contextValidator.server";
import { db } from "~/utils/db.server";
import { validateTextContext } from "./contextValidator.server";

/**
 * Tipos de archivo permitidos para subir como contexto
 */
export const ALLOWED_FILE_TYPES = [
  // Documentos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx

  // Texto plano
  "text/plain",
  "text/markdown",
  "text/csv",

  // Código
  "application/json",
  "text/javascript",
  "text/html",
  "text/css",
];

/**
 * Tamaño máximo de archivo en KB (5MB)
 */
export const MAX_FILE_SIZE_KB = 5000;

/**
 * Interfaz para el resultado de la validación de archivos
 */
interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida un archivo para asegurarse de que cumple con los requisitos
 * @deprecated Use validateFileType and validateFileSize from contextValidator.ts instead
 */
export function validateFile(
  fileType: string,
  fileSizeKB: number
): FileValidationResult {
  // Validar tipo de archivo
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(
        ", "
      )}`,
    };
  }

  // Validar tamaño de archivo
  if (fileSizeKB > MAX_FILE_SIZE_KB) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE_KB}KB`,
    };
  }

  return { isValid: true };
}

/**
 * Añade un archivo como contexto al chatbot
 */
export async function addFileContext(
  chatbotId: string,
  {
    fileName,
    fileType,
    fileUrl,
    sizeKB,
    content,
  }: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    sizeKB: number;
    content?: string;
  }
) {
  // Obtener el chatbot para validaciones
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true, contextSizeKB: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Validar el archivo y límites de contexto
  const validation = await validateFileContext(
    chatbot.userId,
    chatbot.contextSizeKB,
    fileType,
    sizeKB
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Crear el item de contexto
  const contextItem: Omit<ContextItem, "id" | "createdAt"> = {
    type: ContextType.FILE,
    fileName,
    fileType,
    fileUrl,
    sizeKB,
    content: content || null,
    // Añadir campos nulos requeridos por el tipo
    url: null,
    title: null,
  };

  // Añadir el contexto al chatbot
  return addContextItem(chatbotId, contextItem);
}

/**
 * Valida una URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Añade una URL como contexto al chatbot
 */
export async function addUrlContext(
  chatbotId: string,
  {
    url,
    title,
    content,
    sizeKB,
  }: {
    url: string;
    title?: string;
    content?: string;
    sizeKB?: number;
  }
) {
  // Obtener el chatbot para validaciones
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true, contextSizeKB: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Estimar el tamaño si no se proporciona
  // Para URLs sin contenido procesado, asignamos un tamaño estimado de 1KB
  const estimatedSizeKB =
    sizeKB || (content ? Math.ceil(content.length / 1024) : 1);

  // Validar la URL y límites de contexto
  const validation = await validateUrlContext(
    chatbot.userId,
    chatbot.contextSizeKB,
    url,
    estimatedSizeKB
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Crear el item de contexto
  const contextItem: Omit<ContextItem, "id" | "createdAt"> = {
    type: ContextType.LINK,
    url,
    title: title || url,
    content: content || null,
    sizeKB: estimatedSizeKB,
    // Añadir campos nulos requeridos por el tipo
    fileName: null,
    fileType: null,
    fileUrl: null,
  };

  // Añadir el contexto al chatbot
  return addContextItem(chatbotId, contextItem);
}

/**
 * Añade texto como contexto al chatbot
 */
export async function addTextContext(
  chatbotId: string,
  {
    title,
    content,
  }: {
    title: string;
    content: string;
  }
) {
  // Obtener el chatbot para validaciones
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true, contextSizeKB: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Validar el texto y límites de contexto
  const validation = await validateTextContext(
    chatbot.userId,
    chatbot.contextSizeKB,
    content
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Calcular el tamaño del texto en KB
  const sizeKB = Math.ceil(content.length / 1024);

  // Crear el item de contexto
  const contextItem: Omit<ContextItem, "id" | "createdAt"> = {
    type: ContextType.TEXT,
    title,
    content,
    sizeKB,
    // Añadir campos nulos requeridos por el tipo
    fileName: null,
    fileType: null,
    fileUrl: null,
    url: null,
  };

  // Añadir el contexto al chatbot
  return addContextItem(chatbotId, contextItem);
}

/**
 * Obtiene todos los contextos de un chatbot
 */
export async function getChatbotContexts(
  chatbotId: string
): Promise<ContextItem[]> {
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { contexts: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  return chatbot.contexts;
}

/**
 * Calcula el tamaño total de contexto utilizado por un chatbot
 */
export async function calculateTotalContextSize(
  chatbotId: string
): Promise<number> {
  const contexts = await getChatbotContexts(chatbotId);

  return contexts.reduce((total, context) => {
    return total + (context.sizeKB || 0);
  }, 0);
}

/**
 * Actualiza el contador de KB utilizados en el chatbot
 */
export async function updateContextSizeCounter(
  chatbotId: string
): Promise<number> {
  const totalSize = await calculateTotalContextSize(chatbotId);

  await db.chatbot.update({
    where: { id: chatbotId },
    data: { contextSizeKB: totalSize },
  });

  return totalSize;
}
