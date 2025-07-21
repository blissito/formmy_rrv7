import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_KB } from "./contextManager.server";
import { validateContextSizeLimit } from "./planLimits.server";

/**
 * Interfaz para el resultado de la validación de contexto
 */
export interface ContextValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Valida el tamaño máximo de contexto según el plan del usuario
 */
export async function validateContextSize(
  userId: string,
  currentSizeKB: number,
  additionalSizeKB: number
): Promise<ContextValidationResult> {
  try {
    const sizeValidation = await validateContextSizeLimit(
      userId,
      currentSizeKB,
      additionalSizeKB
    );

    if (!sizeValidation.canAdd) {
      return {
        isValid: false,
        error: `Has alcanzado el límite de ${sizeValidation.maxAllowed}KB para contextos en tu plan actual.`,
        details: {
          currentSize: sizeValidation.currentSize,
          maxAllowed: sizeValidation.maxAllowed,
          remainingSize: sizeValidation.remainingSize,
          requestedSize: additionalSizeKB,
        },
      };
    }

    return {
      isValid: true,
      details: {
        currentSize: sizeValidation.currentSize,
        maxAllowed: sizeValidation.maxAllowed,
        remainingSize: sizeValidation.remainingSize,
        requestedSize: additionalSizeKB,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al validar tamaño de contexto",
    };
  }
}

/**
 * Valida el tipo de archivo
 */
export function validateFileType(fileType: string): ContextValidationResult {
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: `Tipo de archivo no permitido: ${fileType}. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(
        ", "
      )}`,
      details: {
        providedType: fileType,
        allowedTypes: ALLOWED_FILE_TYPES,
      },
    };
  }

  return { isValid: true };
}

/**
 * Valida el tamaño del archivo
 */
export function validateFileSize(sizeKB: number): ContextValidationResult {
  if (sizeKB > MAX_FILE_SIZE_KB) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE_KB}KB, tamaño proporcionado: ${sizeKB}KB`,
      details: {
        providedSize: sizeKB,
        maxSize: MAX_FILE_SIZE_KB,
      },
    };
  }

  return { isValid: true };
}

/**
 * Valida una URL
 */
export function validateUrl(url: string): ContextValidationResult {
  try {
    new URL(url);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error:
        "URL inválida. Por favor, introduce una URL completa (incluyendo http:// o https://)",
      details: {
        providedUrl: url,
      },
    };
  }
}

/**
 * Valida el contenido de texto
 */
export function validateTextContent(content: string): ContextValidationResult {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: "El contenido de texto no puede estar vacío",
    };
  }

  // Calcular el tamaño del texto en KB
  const sizeKB = Math.ceil(content.length / 1024);

  // Validar que no exceda el tamaño máximo permitido
  if (sizeKB > MAX_FILE_SIZE_KB) {
    return {
      isValid: false,
      error: `El texto es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE_KB}KB, tamaño proporcionado: ${sizeKB}KB`,
      details: {
        providedSize: sizeKB,
        maxSize: MAX_FILE_SIZE_KB,
      },
    };
  }

  return { isValid: true };
}

/**
 * Realiza una validación completa de un archivo de contexto
 */
export async function validateFileContext(
  userId: string,
  currentSizeKB: number,
  fileType: string,
  fileSizeKB: number
): Promise<ContextValidationResult> {
  // Validar tipo de archivo
  const typeValidation = validateFileType(fileType);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validar tamaño de archivo
  const sizeValidation = validateFileSize(fileSizeKB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validar límite de contexto según plan
  return validateContextSize(userId, currentSizeKB, fileSizeKB);
}

/**
 * Realiza una validación completa de una URL de contexto
 */
export async function validateUrlContext(
  userId: string,
  currentSizeKB: number,
  url: string,
  contentSizeKB: number = 1 // Tamaño estimado por defecto
): Promise<ContextValidationResult> {
  // Validar URL
  const urlValidation = validateUrl(url);
  if (!urlValidation.isValid) {
    return urlValidation;
  }

  // Validar límite de contexto según plan
  return validateContextSize(userId, currentSizeKB, contentSizeKB);
}

/**
 * Realiza una validación completa de un texto de contexto
 */
export async function validateTextContext(
  userId: string,
  currentSizeKB: number,
  content: string
): Promise<ContextValidationResult> {
  // Validar contenido de texto
  const contentValidation = validateTextContent(content);
  if (!contentValidation.isValid) {
    return contentValidation;
  }

  // Calcular el tamaño del texto en KB
  const sizeKB = Math.ceil(content.length / 1024);

  // Validar límite de contexto según plan
  return validateContextSize(userId, currentSizeKB, sizeKB);
}
