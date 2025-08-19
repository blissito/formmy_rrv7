import { Plans } from "@prisma/client";
import { db } from "~/utils/db.server";
import { ALL_MODELS } from "../../app/utils/aiModels";

// Define los límites por plan
export const PLAN_LIMITS = {
  [Plans.FREE]: {
    maxChatbots: 0, // Sin chatbots permitidos
    maxFormmys: 3, // Solo 3 formmys permitidos
    maxContextSizeKB: 1000, // 1MB
    maxConversationsPerMonth: 0, // Sin conversaciones
    maxTokensPerQuery: 0, // Sin contexto
    maxContextQueriesPerDay: 0, // Sin queries con contexto
    availableModels: [], // Sin acceso a modelos
    showBranding: true,
    trialDays: 0, // FREE no tiene trial propio
  },
  [Plans.TRIAL]: {
    maxChatbots: 10, // Todas las funcionalidades PRO
    maxFormmys: Infinity, // Sin límite como PRO
    maxContextSizeKB: 5000, // 5MB como PRO
    maxConversationsPerMonth: 50, // 50 conversaciones específicas para trial
    maxTokensPerQuery: 8000, // Como PRO
    maxContextQueriesPerDay: 100, // Como PRO
    availableModels: [
      "gpt-5-nano",
      "google/gemini-2.5-flash-lite",
      "claude-3-haiku-20240307",
      "claude-3-5-haiku-20241022"
    ], // Todos los modelos STARTER + PRO disponibles
    showBranding: false, // Sin branding como PRO
    trialDays: 60, // 60 días de trial, luego automáticamente a FREE
  },
  [Plans.STARTER]: {
    maxChatbots: 2,
    maxFormmys: Infinity, // Formmys ilimitados desde STARTER
    maxContextSizeKB: 2000, // 2MB
    maxConversationsPerMonth: 50,
    maxTokensPerQuery: 4000, // Protección básica
    maxContextQueriesPerDay: 20, // Limite diario bajo
    availableModels: [
      "gpt-5-nano",
      "google/gemini-2.5-flash-lite"
    ], // Modelos más económicos
    showBranding: true,
    trialDays: 0,
  },
  [Plans.PRO]: {
    maxChatbots: 10,
    maxFormmys: Infinity, // Sin límite en formmys
    maxContextSizeKB: 5000, // 5MB
    maxConversationsPerMonth: 250,
    maxTokensPerQuery: 8000, // Moderada protección
    maxContextQueriesPerDay: 100, // Límite generoso
    availableModels: [
      "gpt-5-nano",
      "google/gemini-2.5-flash-lite",
      "claude-3-haiku-20240307",
      "claude-3-5-haiku-20241022"
    ], // Starter + Anthropic models
    showBranding: false,
    trialDays: 0,
  },
  [Plans.ENTERPRISE]: {
    maxChatbots: Infinity,
    maxFormmys: Infinity, // Sin límite en formmys
    maxContextSizeKB: 10000, // 10MB
    maxConversationsPerMonth: 1000,
    maxTokensPerQuery: 16000, // Límite alto pero protegido
    maxContextQueriesPerDay: 500, // Límite empresarial
    availableModels: ALL_MODELS, // Acceso a todos los modelos incluyendo Sonnet
    showBranding: false,
    trialDays: 0,
  },
};

/**
 * Valida si un usuario puede crear más chatbots según su plan
 */
export async function validateChatbotLimit(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  // Obtener el número actual de chatbots del usuario
  const chatbotCount = await db.chatbot.count({
    where: { userId, status: { not: "DELETED" } },
  });

  const maxAllowed = PLAN_LIMITS[user.plan].maxChatbots;
  const canCreate = chatbotCount < maxAllowed;

  return {
    canCreate,
    currentCount: chatbotCount,
    maxAllowed,
  };
}

/**
 * Verifica si un usuario TRIAL ha expirado y debería pasar a FREE
 */
export async function checkTrialExpiration(userId: string): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, createdAt: true, trialStartedAt: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  // Solo aplicar a usuarios TRIAL
  if (user.plan !== Plans.TRIAL) {
    return {
      isExpired: false,
      daysRemaining: 0,
      trialEndDate: null,
    };
  }

  // Usar trialStartedAt si existe, sino usar createdAt como fallback
  const trialStartDate = user.trialStartedAt || user.createdAt;
  
  // Calcular días desde inicio del trial
  const daysSinceTrialStart = Math.floor(
    (Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const trialDays = PLAN_LIMITS[Plans.TRIAL].trialDays;
  const daysRemaining = Math.max(0, trialDays - daysSinceTrialStart);
  const isExpired = daysRemaining === 0;
  
  const trialEndDate = new Date(trialStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  return {
    isExpired,
    daysRemaining,
    trialEndDate,
  };
}

/**
 * Inicia o resetea el trial de un usuario (para campañas de marketing)
 */
export async function startOrResetTrial(
  userId: string, 
  customTrialDays?: number
): Promise<{
  success: boolean;
  message: string;
  trialEndDate: Date;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, plan: true, email: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const trialDays = customTrialDays || PLAN_LIMITS[Plans.TRIAL].trialDays;
  const now = new Date();
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  // Actualizar usuario a TRIAL con nueva fecha de inicio
  await db.user.update({
    where: { id: userId },
    data: {
      plan: Plans.TRIAL,
      trialStartedAt: now,
    },
  });

  return {
    success: true,
    message: `Trial de ${trialDays} días iniciado para ${user.email}`,
    trialEndDate,
  };
}

/**
 * Verifica el estado del trial de un usuario (para marketing/admin)
 */
export async function getTrialStatus(userId: string): Promise<{
  plan: string;
  isInTrial: boolean;
  daysRemaining: number;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  canResetTrial: boolean;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, createdAt: true, trialStartedAt: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const isInTrial = user.plan === Plans.TRIAL;
  let daysRemaining = 0;
  let trialEndDate = null;
  
  if (isInTrial) {
    const trialCheck = await checkTrialExpiration(userId);
    daysRemaining = trialCheck.daysRemaining;
    trialEndDate = trialCheck.trialEndDate;
  }

  return {
    plan: user.plan,
    isInTrial,
    daysRemaining,
    trialStartDate: user.trialStartedAt,
    trialEndDate,
    canResetTrial: true, // Siempre se puede resetear para marketing
  };
}

/**
 * Aplica restricciones FREE: desactiva chatbots y formmys excedentes
 */
export async function applyFreeRestrictions(userId: string): Promise<{
  chatbotsDeactivated: number;
  formmysDeactivated: number;
  message: string;
}> {
  const limits = PLAN_LIMITS[Plans.FREE];
  
  // 1. Desactivar TODOS los chatbots (FREE permite 0)
  const userChatbots = await db.chatbot.findMany({
    where: { 
      userId, 
      status: { not: "DELETED" },
      isActive: true 
    },
    select: { id: true, name: true },
  });

  let chatbotsDeactivated = 0;
  for (const chatbot of userChatbots) {
    await db.chatbot.update({
      where: { id: chatbot.id },
      data: { isActive: false },
    });
    chatbotsDeactivated++;
  }

  // 2. Desactivar formmys del 4to en adelante (FREE permite solo 3)
  const userProjects = await db.project.findMany({
    where: { 
      userId, 
      isActive: true 
    },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' }, // Los más antiguos se mantienen activos
  });

  let formmysDeactivated = 0;
  if (userProjects.length > limits.maxFormmys) {
    // Desactivar desde el 4to proyecto en adelante
    const projectsToDeactivate = userProjects.slice(limits.maxFormmys);
    
    for (const project of projectsToDeactivate) {
      await db.project.update({
        where: { id: project.id },
        data: { isActive: false },
      });
      formmysDeactivated++;
    }
  }

  const message = `Plan FREE aplicado: ${chatbotsDeactivated} chatbots desactivados, ${formmysDeactivated} formmys desactivados (mantienes ${Math.min(userProjects.length, limits.maxFormmys)} formmys activos)`;

  return {
    chatbotsDeactivated,
    formmysDeactivated,
    message,
  };
}

/**
 * Verifica si un usuario FREE está dentro del período de trial de 60 días
 */
export async function isUserInTrial(userId: string): Promise<{
  inTrial: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, createdAt: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  // Si es un plan de pago o TRIAL, no necesita sub-trial
  if (user.plan === Plans.TRIAL || user.plan === Plans.STARTER || user.plan === Plans.PRO || user.plan === Plans.ENTERPRISE) {
    return {
      inTrial: false,
      daysRemaining: 0,
      trialEndDate: null,
    };
  }

  // Calcular días desde registro
  const daysSinceRegistration = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const trialDays = PLAN_LIMITS[user.plan].trialDays;
  const daysRemaining = Math.max(0, trialDays - daysSinceRegistration);
  const inTrial = daysRemaining > 0;
  
  const trialEndDate = new Date(user.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  return {
    inTrial,
    daysRemaining,
    trialEndDate,
  };
}

/**
 * Valida si un modelo de IA está disponible para el plan del usuario
 */
export async function validateAvailableModel(
  userId: string,
  modelName: string
): Promise<{
  isAvailable: boolean;
  availableModels: string[];
  inTrial: boolean;
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const { inTrial } = await isUserInTrial(userId);
  
  // Si está en trial, tiene acceso a todos los modelos; si no, según su plan
  const availableModels = inTrial 
    ? ALL_MODELS 
    : PLAN_LIMITS[user.plan].availableModels;
    
  const isAvailable = availableModels.includes(modelName);

  return {
    isAvailable,
    availableModels,
    inTrial,
  };
}

/**
 * Verifica si se debe mostrar el branding de Formmy según el plan
 */
export async function shouldShowBranding(userId: string): Promise<boolean> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  return PLAN_LIMITS[user.plan].showBranding;
}

/**
 * Valida si un usuario puede agregar más contexto según su plan
 */
export async function validateContextSizeLimit(
  userId: string,
  currentSizeKB: number,
  additionalSizeKB: number
): Promise<{
  canAdd: boolean;
  currentSize: number;
  maxAllowed: number;
  remainingSize: number;
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const maxAllowed = PLAN_LIMITS[user.plan].maxContextSizeKB;
  const newSize = currentSizeKB + additionalSizeKB;
  const canAdd = newSize <= maxAllowed;
  const remainingSize = Math.max(0, maxAllowed - currentSizeKB);

  return {
    canAdd,
    currentSize: currentSizeKB,
    maxAllowed,
    remainingSize,
  };
}

/**
 * Obtiene todos los límites del plan de un usuario
 */
export async function getUserPlanLimits(userId: string): Promise<{
  plan: Plans;
  limits: (typeof PLAN_LIMITS)[Plans];
}> {
  // Obtener el usuario y su plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  return {
    plan: user.plan,
    limits: PLAN_LIMITS[user.plan],
  };
}
/**
 * Valida si un chatbot puede iniciar más conversaciones este mes según el plan del usuario
 */
export async function validateMonthlyConversationLimit(
  chatbotId: string
): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
  remainingCount: number;
}> {
  // Obtener el chatbot y su usuario
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true, monthlyUsage: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot con ID ${chatbotId} no encontrado`);
  }

  // Obtener el plan del usuario
  const user = await db.user.findUnique({
    where: { id: chatbot.userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario no encontrado`);
  }

  const maxAllowed = PLAN_LIMITS[user.plan].maxConversationsPerMonth;
  const currentCount = chatbot.monthlyUsage;

  // Si el plan es PRO, maxAllowed es Infinity, por lo que siempre puede crear más
  const canCreate = currentCount < maxAllowed;
  const remainingCount =
    maxAllowed === Infinity ? Infinity : Math.max(0, maxAllowed - currentCount);

  return {
    canCreate,
    currentCount,
    maxAllowed,
    remainingCount,
  };
}
