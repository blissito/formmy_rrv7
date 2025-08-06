import { ContextType } from "@prisma/client";
import type { ContextItem } from "@prisma/client";
import { addContextItem } from "./chatbotModel.server";
import {
  validateFileContext,
  validateUrlContext,
} from "./contextValidator.server";
import { db } from "~/utils/db.server";
import { validateTextContext } from "./contextValidator.server";
import { stripHtmlTagsServer } from "~/utils/textUtils";

/**
 * Helper function to clean HTML from content
 * Centralizes HTML cleaning for consistency
 */
function cleanHtmlContent(content: string): string {
  return stripHtmlTagsServer(content);
}

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
    routes: [], // Los archivos no tienen rutas
    // Añadir campos nulos requeridos por el tipo
    url: null,
    title: null,
    questions: null,
    answer: null,
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
    routes,
  }: {
    url: string;
    title?: string;
    content?: string;
    sizeKB?: number;
    routes?: string[];
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
    routes: routes && routes.length > 0 ? routes : [url], // Asegurar que siempre sea un array con al menos la URL
    // Añadir campos nulos requeridos por el tipo
    fileName: null,
    fileType: null,
    fileUrl: null,
    questions: null,
    answer: null,
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
  // Limpiar HTML del contenido
  const cleanContent = cleanHtmlContent(content);
  
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
    cleanContent
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Calcular el tamaño del texto limpio en KB
  const sizeKB = Math.ceil(cleanContent.length / 1024);

  // Crear el item de contexto con contenido limpio
  const contextItem: Omit<ContextItem, "id" | "createdAt"> = {
    type: ContextType.TEXT,
    title,
    content: cleanContent,
    sizeKB,
    routes: [], // Los textos no tienen rutas
    // Añadir campos nulos requeridos por el tipo
    fileName: null,
    fileType: null,
    fileUrl: null,
    url: null,
    questions: null,
    answer: null,
  };

  // Añadir el contexto al chatbot
  return addContextItem(chatbotId, contextItem);
}

/**
 * Añade preguntas y respuestas como contexto al chatbot
 */
export async function addQuestionContext(
  chatbotId: string,
  {
    title,
    questions,
    answer,
  }: {
    title: string;
    questions: string;
    answer: string;
  }
) {
  // Limpiar HTML de la respuesta (las preguntas generalmente no tienen HTML)
  const cleanAnswer = cleanHtmlContent(answer);
  
  // Obtener el chatbot para validaciones
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true, contextSizeKB: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Validar el contenido y límites de contexto
  const totalContent = `${title}\n${questions}\n${cleanAnswer}`;
  const validation = await validateTextContext(
    chatbot.userId,
    chatbot.contextSizeKB,
    totalContent
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Calcular el tamaño del contenido en KB
  const sizeKB = Math.ceil(totalContent.length / 1024);

  // Crear el item de contexto con respuesta limpia
  const contextItem: Omit<ContextItem, "id" | "createdAt"> = {
    type: "QUESTION" as ContextType,
    title,
    questions,
    answer: cleanAnswer,
    content: null, // Para preguntas, usamos campos específicos
    sizeKB,
    routes: [], // Las preguntas no tienen rutas
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
 * Actualiza un contexto de preguntas existente
 */
export async function updateQuestionContext(
  chatbotId: string,
  contextId: string,
  {
    title,
    questions,
    answer,
  }: {
    title: string;
    questions: string;
    answer: string;
  }
) {
  // Limpiar HTML de la respuesta
  const cleanAnswer = cleanHtmlContent(answer);
  
  // Obtener el chatbot y verificar que existe
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { 
      userId: true, 
      contextSizeKB: true,
      contexts: true 
    },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Verificar que el contexto existe y es del tipo QUESTION
  const existingContext = chatbot.contexts.find((ctx: any) => ctx.id === contextId);
  
  if (!existingContext) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  if (existingContext.type !== "QUESTION") {
    throw new Error(`Context ${contextId} is not a question context`);
  }

  // Calcular el nuevo tamaño con respuesta limpia
  const totalContent = `${title}\n${questions}\n${cleanAnswer}`;
  const newSizeKB = Math.ceil(totalContent.length / 1024);
  
  // Calcular el tamaño total después de la actualización
  const otherContextsSize = chatbot.contexts
    .filter((ctx: any) => ctx.id !== contextId)
    .reduce((sum: number, ctx: any) => sum + (ctx.sizeKB || 0), 0);
  
  const totalNewSize = otherContextsSize + newSizeKB;
  
  // Validar que no exceda los límites
  const validation = await validateTextContext(
    chatbot.userId,
    otherContextsSize, // Usar el tamaño sin el contexto actual
    totalContent
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Actualizar el contexto con respuesta limpia
  const updatedContexts = chatbot.contexts.map((ctx: any) => {
    if (ctx.id === contextId) {
      return {
        ...ctx,
        title,
        questions,
        answer: cleanAnswer,
        sizeKB: newSizeKB,
      };
    }
    return ctx;
  });

  // Actualizar el chatbot con los contextos modificados
  const updatedChatbot = await db.chatbot.update({
    where: { id: chatbotId },
    data: { 
      contexts: updatedContexts,
      contextSizeKB: totalNewSize
    },
  });

  return updatedChatbot;
}

/**
 * Actualiza un contexto de texto existente
 */
export async function updateTextContext(
  chatbotId: string,
  contextId: string,
  {
    title,
    content,
  }: {
    title: string;
    content: string;
  }
) {
  // Limpiar HTML del contenido
  const cleanContent = cleanHtmlContent(content);
  
  // Obtener el chatbot y verificar que existe
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { 
      userId: true, 
      contextSizeKB: true,
      contexts: true 
    },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  // Verificar que el contexto existe y es del tipo TEXT
  const existingContext = chatbot.contexts.find((ctx: any) => ctx.id === contextId);
  
  if (!existingContext) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  if (existingContext.type !== "TEXT") {
    throw new Error(`Context ${contextId} is not a text context`);
  }

  // Calcular el nuevo tamaño con contenido limpio
  const newSizeKB = Math.ceil(cleanContent.length / 1024);
  
  // Calcular el tamaño total después de la actualización
  const otherContextsSize = chatbot.contexts
    .filter((ctx: any) => ctx.id !== contextId)
    .reduce((sum: number, ctx: any) => sum + (ctx.sizeKB || 0), 0);
  
  const totalNewSize = otherContextsSize + newSizeKB;
  
  // Validar que no exceda los límites con el contenido limpio
  const validation = await validateTextContext(
    chatbot.userId,
    otherContextsSize, // Usar el tamaño sin el contexto actual
    cleanContent
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Actualizar el contexto con contenido limpio
  const updatedContexts = chatbot.contexts.map((ctx: any) => {
    if (ctx.id === contextId) {
      return {
        ...ctx,
        title,
        content: cleanContent,
        sizeKB: newSizeKB,
      };
    }
    return ctx;
  });

  // Actualizar el chatbot con los contextos modificados
  const updatedChatbot = await db.chatbot.update({
    where: { id: chatbotId },
    data: { 
      contexts: updatedContexts,
      contextSizeKB: totalNewSize
    },
  });

  return updatedChatbot;
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
