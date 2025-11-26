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
 * Factory function que crea el tool con chatbotId en closure
 *
 * @param chatbotId - ID del chatbot (capturado en closure)
 * @returns Tool de Vercel AI SDK
 */
export const createSaveLeadTool = (chatbotId: string) => {
  // 🔒 VALIDAR FORMATO AL CREAR EL TOOL
  if (!/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    throw new Error(`[Save Lead Tool] chatbotId inválido: ${chatbotId}`);
  }

  return tool({
    description: `Save lead/contact information when the user voluntarily provides personal details.

🎯 WHEN TO USE:
- User explicitly shares email, phone, or other contact information
- User asks to be contacted
- User wants to receive more information
- User signs up for something

📋 DATA COLLECTION STRATEGY:
PRIORITY: Get BOTH email AND phone when possible (best quality lead)
MINIMUM: At least ONE (email OR phone) is required

📱 WHATSAPP CONVERSATIONS:
- Phone is AUTO-CAPTURED (don't ask for it)
- ONLY ask for: email, name, productInterest
- Example: "¿Cuál es tu email para enviarte más información?"

💻 WEB CONVERSATIONS:
- Ask for BOTH email and phone if context allows
- Minimum: one of them

📋 FIELDS TO SAVE:
- name: Full name of the contact
- email: Email address (REQUIRED for WhatsApp, optional for Web)
- phone: Phone number (AUTO-CAPTURED on WhatsApp, ask on Web)
- productInterest: What product/service they're interested in

✅ EXAMPLES:

WhatsApp User: "Quiero info del plan Enterprise"
→ Ask: "¿Cuál es tu email para enviarte los detalles?"
→ Save: { email: "user@example.com", productInterest: "Plan Enterprise" }
   (phone auto-captured from WhatsApp)

Web User: "My email is john@example.com, call me at +1-555-0123"
→ Save: { email: "john@example.com", phone: "+1-555-0123" }

❌ DO NOT:
- Ask for phone on WhatsApp (already captured)
- Use without user consent
- Save if user declines to share

⚠️ CRITICAL:
- WhatsApp = phone auto-captured, GET EMAIL
- Web = ask for BOTH (email AND phone) if possible
- Always confirm with user after saving
`,
    inputSchema: z.object({
      name: z.string().optional().describe("Full name of the contact"),
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
          userId: null, // Anonymous user
          userPlan: "ANONYMOUS",
          message: "",
          integrations: {},
          isGhosty: false,
        };

        // Llamar handler con validaciones incorporadas
        const result = await saveContactInfoHandler(params, context);

        if (!result.success) {
          return `Error al guardar información de contacto: ${result.error || "Error desconocido"}. Por favor verifica los datos proporcionados.`;
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
