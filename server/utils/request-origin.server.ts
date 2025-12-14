/**
 * Request Origin Utility
 *
 * Extrae el dominio de origen de un request usando Origin o Referer headers.
 * Usado para validación de dominios permitidos en chatbots públicos.
 *
 * Created: Dec 2025
 */

/**
 * Extrae el origen (dominio) de un request HTTP.
 *
 * Prioridad de headers:
 * 1. Origin - Enviado en CORS requests (cross-origin fetch/XMLHttpRequest)
 * 2. Referer - Enviado casi siempre, fallback para same-origin requests
 *
 * @param request - Request HTTP entrante
 * @returns URL de origen (ej: "https://ejemplo.com") o null si no hay headers
 */
export function getRequestOrigin(request: Request): string | null {
  // Intentar Origin header primero (más confiable para CORS)
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  // Fallback a Referer header
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      // Extraer solo el origen (protocolo + dominio + puerto)
      return new URL(referer).origin;
    } catch {
      // Referer malformado, ignorar
      return null;
    }
  }

  // Sin headers de origen (server-side request, curl, etc.)
  return null;
}

/**
 * Crea headers CORS dinámicos basados en la validación de dominio.
 *
 * IMPORTANTE: Siempre permitimos que el browser lea la respuesta (incluso errores 403)
 * para que el widget pueda mostrar un mensaje de error apropiado al usuario.
 * Si bloqueamos CORS en el error, el widget solo ve un error opaco y se queda en loading.
 *
 * @param origin - Origen del request (o null)
 * @param allowedDomains - Lista de dominios permitidos
 * @param isAllowed - Resultado de la validación (no afecta CORS, solo para logging)
 * @returns Headers para la respuesta
 */
export function createCorsHeaders(
  origin: string | null,
  allowedDomains: string[],
  isAllowed: boolean
): HeadersInit {
  // Siempre permitir que el browser lea la respuesta para mostrar errores correctamente
  // El control de acceso real está en el status code (403), no en CORS

  // Si no hay restricciones configuradas, permitir todo
  if (!allowedDomains || allowedDomains.length === 0) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  // Con restricciones: permitir el origen específico (incluso para errores)
  // para que el widget pueda leer y mostrar el mensaje de error
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
