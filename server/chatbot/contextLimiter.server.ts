import { Plans } from "@prisma/client";
import { PLAN_LIMITS } from "./planLimits.server";

/**
 * Función simple para limitar contexto y proteger costos
 */
export function limitContext(
  content: string,
  userPlan: Plans
): {
  limitedContent: string;
  wasTruncated: boolean;
  originalLength: number;
  finalLength: number;
  tokensEstimated: number;
} {
  const maxTokens = PLAN_LIMITS[userPlan].maxTokensPerQuery;
  
  // Si no hay límite (plan sin contexto), retornar vacío
  if (maxTokens === 0) {
    return {
      limitedContent: "",
      wasTruncated: true,
      originalLength: content.length,
      finalLength: 0,
      tokensEstimated: 0,
    };
  }

  // Estimación simple: ~4 caracteres = 1 token
  const maxChars = maxTokens * 4;
  
  if (content.length <= maxChars) {
    // No necesita truncamiento
    return {
      limitedContent: content,
      wasTruncated: false,
      originalLength: content.length,
      finalLength: content.length,
      tokensEstimated: Math.ceil(content.length / 4),
    };
  }

  // Truncar inteligentemente por párrafos
  const truncated = truncateByParagraphs(content, maxChars);
  
  return {
    limitedContent: truncated,
    wasTruncated: true,
    originalLength: content.length,
    finalLength: truncated.length,
    tokensEstimated: maxTokens,
  };
}

/**
 * Trunca contenido tratando de mantener párrafos completos
 */
function truncateByParagraphs(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  
  // Intentar cortar por párrafos
  const paragraphs = content.split('\n\n');
  let result = '';
  
  for (const paragraph of paragraphs) {
    if ((result + paragraph + '\n\n').length > maxChars) {
      break;
    }
    result += paragraph + '\n\n';
  }
  
  // Si no pudimos incluir ni un párrafo, cortar por caracteres
  if (result.length === 0) {
    result = content.substring(0, maxChars - 100) + '...';
  }
  
  return result.trim();
}

/**
 * Verifica si un usuario puede hacer más consultas con contexto hoy
 */
export async function canUseContextToday(
  userId: string,
  userPlan: Plans
): Promise<{
  canUse: boolean;
  usedToday: number;
  dailyLimit: number;
}> {
  const dailyLimit = PLAN_LIMITS[userPlan].maxContextQueriesPerDay;
  
  if (dailyLimit === 0) {
    return { canUse: false, usedToday: 0, dailyLimit: 0 };
  }

  // TODO: Implementar contador real en base de datos
  // Por ahora, siempre permitir (implementación futura)
  const usedToday = 0;
  
  return {
    canUse: usedToday < dailyLimit,
    usedToday,
    dailyLimit,
  };
}