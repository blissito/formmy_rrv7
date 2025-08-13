import { nanoid } from "nanoid";

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

// Configuración por defecto para nuevos chatbots
export const DEFAULT_CHATBOT_CONFIG = {
  description: "Un asistente virtual inteligente y amigable",
  personality:
    "Eres un asistente virtual amigable, profesional y servicial. Respondes de manera clara y concisa, siempre tratando de ser útil.",
  welcomeMessage:
    "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  aiModel: "google/gemini-2.0-flash-exp:free",
  primaryColor: "#3B82F6",
  theme: "light",
  temperature: 0.7,
  instructions:
    "Eres un asistente virtual útil y amigable. Responde de manera profesional y clara a las preguntas de los usuarios.",
};

// Función para generar nombre aleatorio
export function generateRandomChatbotName(): string {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const id = nanoid(3);
  return `${animal}-${adjective}-${id}`;
}