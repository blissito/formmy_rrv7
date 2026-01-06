/**
 * 💼 Save Lead Tool - Captura de Leads
 *
 * Permite al chatbot guardar información de leads cuando el usuario
 * proporciona datos voluntariamente (email, teléfono, etc.)
 *
 * 🔒 SEGURIDAD:
 * - chatbotId capturado en CLOSURE (no modificable por modelo)
 * - Handler valida duplicados y formato
 * - Guarda en modelo Lead (no Contact - separación de concerns)
 *
 * 💡 USO:
 * - El modelo detecta cuando el usuario comparte info de contacto
 * - Llama este tool para guardar el lead
 * - Retorna confirmación al usuario
 */
// Reutilizar handler existente
import { saveContactInfoHandler } from "@/server/tools/handlers/contact";
import { tool } from "ai";
import { z } from "zod";

/**
 * Factory function que crea el tool con chatbotId y conversationId en closure
 *
 * @param chatbotId - ID del chatbot (capturado en closure)
 * @param conversationId - ID de la conversación (opcional, capturado en closure)
 * @returns Tool de Vercel AI SDK
 */
export const createSaveLeadTool = (
  chatbotId: string,
  conversationId?: string,
  channel: "whatsapp" | "web" = "web" // ⬅️ NUEVO: Indica el canal
) => {
  // 🔒 VALIDAR FORMATO AL CREAR EL TOOL
  if (!/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    throw new Error(`[Save Lead Tool] chatbotId inválido: ${chatbotId}`);
  }

  // 🎯 PROMPT DINÁMICO SEGÚN EL CANAL
  const isWhatsApp = channel === "whatsapp";

  return tool({
    description: isWhatsApp
      ? // 📱 PROMPT PARA WHATSAPP
        `Guarda información de contacto del lead cuando muestra interés en productos/servicios.

🎯 CUÁNDO USAR:
- Usuario pide cotización, información, o contacto
- Usuario pregunta precios o servicios
- Usuario muestra interés en productos

⚠️ CONTEXTO: Estás en WHATSAPP
- El TELÉFONO ya está capturado automáticamente del número de WhatsApp
- NO preguntes por teléfono (ya lo tienes)
- SOLO pregunta: nombre + email

📋 REGLA DE CAPTURA:
Pregunta: "¿Me compartes tu nombre y email?"
- Pide AMBOS datos juntos en una sola pregunta
- NO preguntes uno por uno

📝 CAMPOS A GUARDAR:
- name: Nombre completo (REQUERIDO)
- email: Email (REQUERIDO)
- phone: NO pidas (auto-capturado)
- productInterest: Infiere del contexto (NO preguntes)

⚠️ MÍNIMO PARA GUARDAR:
✅ nombre + email → Guardar (phone se agrega automáticamente)
❌ solo nombre → NO guardar
❌ solo email → NO guardar

✅ EJEMPLO:
Usuario: "Quiero cotización del Plan Enterprise"
Tú: "¿Me compartes tu nombre y email?"
Usuario: "Juan Pérez, juan@empresa.com"
Tú: [Llamar: saveLeadTool({ name: "Juan Pérez", email: "juan@empresa.com", productInterest: "Plan Enterprise" })]
Tú: "¡Perfecto Juan! Guardé tu contacto. Te enviaremos la cotización pronto."

❌ NUNCA:
- Preguntes por teléfono (ya está capturado)
- Preguntes "¿qué producto te interesa?" (infiere del contexto)
- Guardes sin nombre Y email
`
      : // 💻 PROMPT PARA WEB
        `Guarda información de contacto del lead cuando muestra interés en productos/servicios.

🎯 CUÁNDO USAR:
- Usuario pide cotización, información, o contacto
- Usuario pregunta precios o servicios
- Usuario muestra interés en productos

⚠️ CONTEXTO: Estás en WEB
- El teléfono NO está capturado
- Debes pedir: nombre + email + teléfono

📋 REGLA DE CAPTURA:
Pregunta: "¿Me compartes tu nombre, email y teléfono?"
- Pide los 3 datos juntos en una sola pregunta
- NO preguntes uno por uno

📝 CAMPOS A GUARDAR:
- name: Nombre completo (REQUERIDO)
- email: Email (pide siempre)
- phone: Teléfono (pide siempre)
- productInterest: Infiere del contexto (NO preguntes)

⚠️ MÍNIMO PARA GUARDAR:
✅ nombre + email + teléfono → Guardar (ideal)
✅ nombre + email → Guardar
✅ nombre + teléfono → Guardar
❌ solo nombre → NO guardar (necesitas email O teléfono)

✅ EJEMPLO:
Usuario: "Me interesa el Plan Pro"
Tú: "¿Me compartes tu nombre, email y teléfono?"
Usuario: "María López, maria@empresa.com, 5512345678"
Tú: [Llamar: saveLeadTool({ name: "María López", email: "maria@empresa.com", phone: "5512345678", productInterest: "Plan Pro" })]
Tú: "¡Listo María! Ya tengo tu información. El equipo te contactará pronto."

❌ NUNCA:
- Preguntes "¿qué producto te interesa?" (infiere del contexto)
- Guardes sin nombre
- Guardes solo con nombre (necesitas email O teléfono)
`,
    inputSchema: z.object({
      name: z.string().min(1).describe("Full name of the contact (REQUIRED)"),
      email: z.string().email().optional().describe("Email address"),
      phone: z.string().optional().describe("Phone number"),
      productInterest: z
        .string()
        .optional()
        .describe("Product/service they're interested in"),
    }),

    execute: async (params) => {
      try {
        // Construir context para el handler
        const context = {
          chatbotId, // ⭐ CLOSURE - No modificable
          conversationId, // ⭐ CLOSURE - Vincula lead a conversación
          userId: null, // Anonymous user
          userPlan: "ANONYMOUS",
          message: "",
          integrations: {},
          isGhosty: false,
          channel, // ⭐ CLOSURE - Canal de comunicación
        };

        // Llamar handler con validaciones incorporadas
        const result = await saveContactInfoHandler(params, context);

        if (!result.success) {
          return `Error al guardar información de contacto: ${result.message || "Error desconocido"}. Por favor verifica los datos proporcionados.`;
        }

        // Mensaje de confirmación amigable
        return `✅ ¡Perfecto! He guardado tu información de contacto. ${result.message || "Alguien del equipo se pondrá en contacto contigo pronto."}`;
      } catch (error) {
        console.error("[Save Lead Tool] Error:", error);
        return `Hubo un problema al guardar la información de contacto: ${error instanceof Error ? error.message : "Error desconocido"}. Por favor intenta nuevamente.`;
      }
    },
  });
};
