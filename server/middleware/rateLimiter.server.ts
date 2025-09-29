/**
 * Rate Limiter Middleware para Chatbot API
 * Implementación simple en memoria con ventana deslizante
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastReset: number;
}

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo número de requests por ventana
  keyGenerator?: (request: Request, identifier: string) => string; // Generador de keys personalizado
}

// Store en memoria (en producción usar Redis)
const requestStore = new Map<string, RateLimitEntry>();

// Configuraciones por tipo
export const RATE_LIMIT_CONFIGS = {
  chatbot: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20, // 20 requests por minuto
  },
  health: {
    windowMs: 10 * 1000, // 10 segundos
    maxRequests: 10, // 10 requests por 10 segundos
  },
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 5, // 5 uploads por 5 minutos
  }
} as const;

/**
 * Aplica rate limiting a una request
 */
export async function applyRateLimit(
  request: Request,
  identifier: string, // userId o IP
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  const now = Date.now();
  const key = config.keyGenerator ?
    config.keyGenerator(request, identifier) :
    `${identifier}:${request.url}`;

  // Limpiar entradas expiradas cada cierto tiempo
  if (requestStore.size > 10000) {
    cleanupExpiredEntries(now);
  }

  let entry = requestStore.get(key);

  // Crear nueva entrada si no existe o la ventana expiró
  if (!entry || (now - entry.windowStart) >= config.windowMs) {
    entry = {
      count: 1,
      windowStart: now,
      lastReset: now
    };
    requestStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // Incrementar contador
  entry.count++;

  // Verificar si excede el límite
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.windowStart + config.windowMs,
      retryAfter
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.windowStart + config.windowMs
  };
}

/**
 * Middleware wrapper para endpoints
 */
export function rateLimitWrapper(
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    // Obtener identificador (preferir userId, fallback a IP)
    const identifier = getRequestIdentifier(request);
    const config = RATE_LIMIT_CONFIGS[configName];

    const rateLimitResult = await applyRateLimit(request, identifier, config);

    // Headers de rate limiting
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      'X-RateLimit-Window': config.windowMs.toString()
    };

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Demasiadas solicitudes',
        userMessage: `Has alcanzado el límite de ${config.maxRequests} solicitudes por ${config.windowMs / 1000} segundos. Intenta de nuevo más tarde.`,
        retryAfter: rateLimitResult.retryAfter,
        resetTime: rateLimitResult.resetTime
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          ...headers
        }
      });
    }

    // Ejecutar handler original
    const response = await handler(request, ...args);

    // Agregar headers de rate limiting a la respuesta
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Obtiene el identificador de la request (userId > IP > fallback)
 */
function getRequestIdentifier(request: Request): string {
  // 1. Intentar obtener userId de headers de auth
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    // Simular extracción de userId (en producción usar JWT decode)
    const userIdMatch = authHeader.match(/user-id:([^;]+)/);
    if (userIdMatch) {
      return `user:${userIdMatch[1]}`;
    }
  }

  // 2. Obtener IP de headers
  const forwardedFor = request.headers.get('X-Forwarded-For');
  const realIp = request.headers.get('X-Real-IP');
  const remoteAddr = request.headers.get('Remote-Addr');

  const ip = forwardedFor?.split(',')[0] || realIp || remoteAddr || 'unknown';

  return `ip:${ip}`;
}

/**
 * Limpiar entradas expiradas del store
 */
function cleanupExpiredEntries(now: number): void {
  const maxAge = 10 * 60 * 1000; // 10 minutos

  for (const [key, entry] of requestStore.entries()) {
    if (now - entry.lastReset > maxAge) {
      requestStore.delete(key);
    }
  }
}

/**
 * Función para debugging/monitoring
 */
export function getRateLimitStats(): {
  totalKeys: number;
  activeWindows: number;
  memoryUsage: string;
} {
  const now = Date.now();
  let activeWindows = 0;

  for (const entry of requestStore.values()) {
    const maxWindowMs = Math.max(
      RATE_LIMIT_CONFIGS.chatbot.windowMs,
      RATE_LIMIT_CONFIGS.health.windowMs,
      RATE_LIMIT_CONFIGS.upload.windowMs
    );

    if (now - entry.windowStart < maxWindowMs) {
      activeWindows++;
    }
  }

  return {
    totalKeys: requestStore.size,
    activeWindows,
    memoryUsage: `${Math.round(JSON.stringify([...requestStore.entries()]).length / 1024)}KB`
  };
}

/**
 * Reset manual del rate limiting (para testing)
 */
export function resetRateLimit(identifier?: string): void {
  if (identifier) {
    // Reset específico
    for (const key of requestStore.keys()) {
      if (key.includes(identifier)) {
        requestStore.delete(key);
      }
    }
  } else {
    // Reset completo
    requestStore.clear();
  }
}