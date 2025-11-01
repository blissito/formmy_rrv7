import { nanoid } from "nanoid";
import { Plans } from "@prisma/client";
import { isUserInTrial } from "../../server/chatbot/planLimits.server";

export {
  validateUserAIModelAccess,
  getUserPlanFeatures,
} from "../../server/chatbot/userModel.server";

// Arrays para generar nombres aleatorios
const ANIMALS = [
  "leon",
  "tigre",
  "oso",
  "lobo",
  "aguila",
  "halcon",
  "delfin",
  "ballena",
  "elefante",
  "jirafa",
  "panda",
  "koala",
  "zorro",
  "conejo",
  "gato",
  "perro",
  "caballo",
  "unicornio",
  "dragon",
  "fenix",
  "buho",
  "colibri",
  "mariposa",
  "abeja",
];

const ADJECTIVES = [
  "valiente",
  "potente",
  "bernaculo",
  "fuerte",
  "inteligente",
  "amigable",
  "entrañable",
  "brillante",
  "audaz",
  "gentil",
  "noble",
  "magico",
  "poderoso",
  "elegante",
  "gracioso",
  "curioso",
  "satírico",
  "pacifico",
  "energico",
  "luminoso",
  "fluorecente",
];

/**
 * Obtiene el modelo por defecto según el plan del usuario
 */
export async function getDefaultAIModelForUser(userId: string): Promise<string | null> {
  const { db } = await import("~/utils/db.server");
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  const { inTrial } = await isUserInTrial(userId);
  
  // Si es FREE sin trial, retornar null
  if (user.plan === Plans.FREE && !inTrial) {
    return null;
  }

  // Todos los planes (STARTER, TRIAL, PRO, ENTERPRISE) usan gpt-5-nano por defecto
  return "gpt-5-nano";
}

// Configuración por defecto para nuevos chatbots
export const DEFAULT_CHATBOT_CONFIG = {
  description: "Un asistente virtual inteligente y amigable",
  personality:
    "Eres un asistente virtual amigable, profesional y servicial. Respondes de manera clara y concisa, siempre tratando de ser útil.",
  welcomeMessage:
    "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  aiModel: "gpt-5-nano", // Será reemplazado por getDefaultAIModelForUser
  primaryColor: "#3B82F6",
  theme: "light",
  temperature: 0.7,
  instructions:
    "Eres un asistente virtual útil y amigable. Responde de manera profesional y clara a las preguntas de los usuarios.",
};

// Función para generar nombre aleatorio
export function generateRandomChatbotName(): string {
  return "Ghosty";
}