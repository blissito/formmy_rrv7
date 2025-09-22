import { ChatbotStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "~/utils/db.server";
import { getDefaultModelForPlan } from "~/utils/aiModels";

/**
 * Crea un chatbot demo automático para nuevos usuarios durante el período de revisión de Meta
 * Este chatbot viene pre-configurado con contextos de ejemplo para evitar el paso de creación
 */
export async function createDemoChatbot(userId: string, userEmail: string, userPlan: string) {
  try {
    // Verificar si el usuario ya tiene chatbots
    const existingChatbots = await db.chatbot.count({
      where: {
        userId,
        status: { not: "DELETED" }
      }
    });

    // Si ya tiene chatbots, no crear el demo
    if (existingChatbots > 0) {
      console.log(`ℹ️ Usuario ${userEmail} ya tiene ${existingChatbots} chatbot(s), omitiendo demo`);
      return null;
    }
    // Generar slug único para el chatbot demo
    const slug = `demo-chatbot-${nanoid(6)}`;

    // Obtener el modelo por defecto según el plan
    const defaultModel = getDefaultModelForPlan(userPlan);

    // Crear el chatbot demo con configuración inicial
    const demoChatbot = await db.chatbot.create({
      data: {
        name: "Mi Asistente Demo",
        description: "Chatbot de demostración con contextos de ejemplo para explorar las funcionalidades de Formmy",
        slug,
        userId,
        personality: "profesional y amigable",
        welcomeMessage: "¡Hola! Soy tu asistente demo de Formmy. Estoy aquí para ayudarte a explorar todas las funcionalidades de la plataforma. ¿En qué puedo ayudarte hoy?",
        aiModel: defaultModel,
        primaryColor: "#5B21B6",
        theme: "modern",
        temperature: 0.7,
        instructions: `Eres un asistente útil y profesional creado con Formmy. Tu objetivo es demostrar las capacidades de la plataforma mientras ayudas al usuario con sus consultas.

Recuerda:
- Ser conciso y directo en tus respuestas
- Proporcionar información útil y precisa
- Mantener un tono profesional pero amigable
- Destacar las funcionalidades de Formmy cuando sea relevante`,
        customInstructions: "",
        status: ChatbotStatus.PUBLISHED, // Publicado automáticamente
        isActive: true, // Activo desde el inicio
        conversationCount: 0,
        monthlyUsage: 0,
        contextSizeKB: 5, // Tamaño aproximado de los contextos demo
        contexts: [
          {
            id: nanoid(),
            type: "TEXT",
            title: "Información sobre Formmy",
            content: `Formmy es una plataforma SaaS avanzada para crear chatbots y formularios inteligentes con IA.

Características principales:
- Chatbots con IA personalizable
- Integración con WhatsApp Business
- Formularios inteligentes con validación automática
- Análisis y métricas en tiempo real
- Integraciones con herramientas populares
- Soporte para múltiples idiomas
- Panel de control intuitivo`,
            sizeKB: 1,
            createdAt: new Date(),
            routes: []
          },
          {
            id: nanoid(),
            type: "QUESTION",
            title: "¿Qué es un chatbot?",
            content: "Un chatbot es un asistente virtual que puede conversar con usuarios de forma automática, respondiendo preguntas y proporcionando información relevante las 24 horas del día.",
            sizeKB: 0.5,
            createdAt: new Date(),
            routes: []
          },
          {
            id: nanoid(),
            type: "QUESTION",
            title: "¿Cómo integro WhatsApp?",
            content: "Para integrar WhatsApp Business, ve a Integraciones en tu panel de control, selecciona WhatsApp y sigue el proceso de configuración con Meta Business. Necesitarás una cuenta de WhatsApp Business verificada.",
            sizeKB: 0.5,
            createdAt: new Date(),
            routes: []
          },
          {
            id: nanoid(),
            type: "TEXT",
            title: "Planes y precios",
            content: `Ofrecemos diferentes planes para adaptarnos a tus necesidades:

STARTER ($149 MXN/mes):
- 2 chatbots
- 50 conversaciones mensuales
- Modelo GPT-3.5 Turbo

PRO ($499 MXN/mes):
- 10 chatbots
- 250 conversaciones mensuales
- Modelos avanzados de IA

ENTERPRISE ($1,499 MXN/mes):
- Chatbots ilimitados
- 1000 conversaciones mensuales
- Todos los modelos de IA
- Soporte prioritario`,
            sizeKB: 1,
            createdAt: new Date(),
            routes: []
          },
          {
            id: nanoid(),
            type: "QUESTION",
            title: "¿Puedo personalizar mi chatbot?",
            content: "Sí, puedes personalizar completamente tu chatbot: cambiar su personalidad, instrucciones, colores, tema visual, mensaje de bienvenida, modelo de IA y temperatura de respuestas.",
            sizeKB: 0.5,
            createdAt: new Date(),
            routes: []
          },
          {
            id: nanoid(),
            type: "TEXT",
            title: "Guía de inicio rápido",
            content: `Para comenzar con Formmy:

1. Personaliza este chatbot demo o crea uno nuevo
2. Agrega contextos (archivos, URLs, preguntas frecuentes)
3. Configura las integraciones que necesites
4. Prueba tu chatbot en la pestaña de Preview
5. Publícalo y comparte el enlace o intégralo en tu sitio web

Puedes entrenar tu chatbot con:
- Documentos PDF, DOCX, TXT
- Páginas web y URLs
- Preguntas y respuestas personalizadas
- Bases de conocimiento existentes`,
            sizeKB: 1.5,
            createdAt: new Date(),
            routes: []
          }
        ]
      }
    });

    console.log(`✅ Chatbot demo creado para usuario ${userEmail} (Plan: ${userPlan})`);
    return demoChatbot;

  } catch (error) {
    console.error("Error creando chatbot demo:", error);
    // No fallar el proceso de registro si el chatbot demo no se puede crear
    return null;
  }
}