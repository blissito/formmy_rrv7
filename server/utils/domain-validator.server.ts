/**
 * Domain Validator Utility
 *
 * Utilidades para normalizar y validar dominios permitidos en chatbots.
 * Previene problemas comunes con www, protocolos, puertos, y paths.
 *
 * Created: Oct 2025
 */

/**
 * Normaliza un dominio a su forma canónica (solo hostname)
 *
 * Ejemplos:
 * - "www.ejemplo.com" → "www.ejemplo.com"
 * - "https://ejemplo.com/" → "ejemplo.com"
 * - "ejemplo.com:3000" → "ejemplo.com"
 * - "http://www.ejemplo.com/path" → "www.ejemplo.com"
 *
 * @param domain - Dominio en cualquier formato
 * @returns Hostname normalizado (solo dominio, sin protocolo/puerto/path)
 */
export function normalizeDomain(domain: string): string {
  try {
    let normalized = domain.trim().toLowerCase();

    // Agregar https:// si falta protocolo (requerido por URL parser)
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }

    // Parsear URL para extraer hostname
    const url = new URL(normalized);

    // Retornar solo hostname (sin protocolo, puerto, path)
    return url.hostname;
  } catch (error) {
    // Si falla el parsing, retornar el dominio limpio sin protocolo
    console.warn(`⚠️ Error parsing domain "${domain}":`, error);
    return domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  }
}

/**
 * Compara dos dominios de forma flexible (ignora www)
 *
 * Ejemplos:
 * - domainsMatch("www.ejemplo.com", "ejemplo.com") → true
 * - domainsMatch("ejemplo.com", "www.ejemplo.com") → true
 * - domainsMatch("sub.ejemplo.com", "ejemplo.com") → false
 *
 * @param origin - Dominio de origen (del request)
 * @param allowed - Dominio permitido (de la configuración)
 * @returns true si los dominios coinciden (ignorando www)
 */
export function domainsMatch(origin: string, allowed: string): boolean {
  // Normalizar ambos dominios primero
  const originNorm = normalizeDomain(origin);
  const allowedNorm = normalizeDomain(allowed);

  // Remover www para comparación flexible
  const originWithoutWww = originNorm.replace(/^www\./, '');
  const allowedWithoutWww = allowedNorm.replace(/^www\./, '');

  // Comparar ambas versiones (con y sin www)
  return originNorm === allowedNorm ||
         originWithoutWww === allowedWithoutWww;
}

/**
 * Valida si un dominio de origen está permitido
 *
 * @param origin - Dominio de origen (del header 'origin')
 * @param allowedDomains - Lista de dominios permitidos
 * @returns { allowed: boolean, details: object } - Resultado con detalles para debugging
 */
export function validateDomainAccess(
  origin: string | null,
  allowedDomains: string[]
): {
  allowed: boolean;
  originHost: string | null;
  normalizedAllowed: string[];
  matchedDomain?: string;
  reason?: string;
} {
  // Si no hay origin header, validar según restricciones
  // FIX Oct 16, 2025: Bug de seguridad - navegadores con privacidad estricta pueden no enviar origin/referer
  if (!origin) {
    // Si HAY restricciones de dominio configuradas, BLOQUEAR (no podemos validar)
    if (allowedDomains && allowedDomains.length > 0) {
      return {
        allowed: false,
        originHost: null,
        normalizedAllowed: allowedDomains.map(d => normalizeDomain(d)),
        reason: 'No origin/referer header provided, but domain restrictions are active. Cannot validate access.'
      };
    }

    // Si NO hay restricciones, permitir (server-side requests, testing, chatbots públicos sin restricciones)
    return {
      allowed: true,
      originHost: null,
      normalizedAllowed: [],
      reason: 'No origin header (server-side request) and no domain restrictions configured'
    };
  }

  // Si no hay dominios configurados, permitir
  if (!allowedDomains || allowedDomains.length === 0) {
    return {
      allowed: true,
      originHost: null,
      normalizedAllowed: [],
      reason: 'No domain restrictions configured'
    };
  }

  try {
    // Extraer hostname del origin
    const originHost = new URL(origin).hostname;

    // Normalizar dominios permitidos
    const normalizedAllowed = allowedDomains.map(d => normalizeDomain(d));

    // Buscar coincidencia
    const matchedDomain = allowedDomains.find(allowed =>
      domainsMatch(originHost, allowed)
    );

    if (matchedDomain) {
      return {
        allowed: true,
        originHost,
        normalizedAllowed,
        matchedDomain,
        reason: `Matched allowed domain: ${matchedDomain}`
      };
    } else {
      return {
        allowed: false,
        originHost,
        normalizedAllowed,
        reason: `Origin "${originHost}" not in allowed domains: ${normalizedAllowed.join(', ')}`
      };
    }
  } catch (error) {
    console.error('❌ Error validating domain access:', error);
    return {
      allowed: false,
      originHost: null,
      normalizedAllowed: [],
      reason: `Invalid origin format: ${origin}`
    };
  }
}

/**
 * Normaliza y valida una lista de dominios antes de guardar
 *
 * @param domains - Array de dominios (pueden venir con protocolos, paths, etc)
 * @returns Array de dominios normalizados y validados
 */
export function normalizeDomainsForStorage(domains: string[]): string[] {
  return domains
    .map(d => normalizeDomain(d))
    .filter(d => d && d.length > 0) // Remover vacíos
    .filter((d, index, self) => self.indexOf(d) === index); // Remover duplicados
}
