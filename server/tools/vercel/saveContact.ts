/**
 * 💼 Save Contact Tool - Captura de Leads
 *
 * Permite al chatbot guardar información de contacto cuando el usuario
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

import { tool } from "ai";
import { z } from "zod";

/**
 * Factory function que crea el tool con chatbotId en closure
 *
 * @param chatbotId - ID del chatbot (capturado en closure)
 * @returns Tool de Vercel AI SDK
 */
export const createSaveContactTool = (chatbotId: string) => {
  // 🔒 VALIDAR FORMATO AL CREAR EL TOOL
  if (!/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    throw new Error(`[Save Contact Tool] chatbotId inválido: ${chatbotId}`);
  }

  return tool({
    description: `Save lead/contact information when the user voluntarily provides personal details.

🎯 WHEN TO USE:
- User explicitly shares email, phone, or other contact information
- User asks to be contacted
- User wants to receive more information
- User signs up for something

📋 WHAT TO SAVE:
- name: Full name of the contact
- email: Email address
- phone: Phone number (with country code if provided)
- productInterest: What product/service they're interested in
- position: Job title/position (if mentioned)
- website: Company website (if mentioned)
- notes: Any additional relevant information

✅ EXAMPLES OF WHEN TO USE:
User: "My email is john@example.com, I want to know more about the Enterprise plan"
→ Save: { email: "john@example.com", productInterest: "Enterprise plan" }

User: "Can someone call me at +1-555-0123? I'm the CEO of Acme Corp"
→ Save: { phone: "+1-555-0123", position: "CEO", notes: "Acme Corp" }

❌ DO NOT USE:
- When user hasn't shared contact info
- For automated data collection without consent
- If user explicitly declines to share information

⚠️ IMPORTANT:
- At least email OR phone is required
- Always confirm with the user after saving
- Respect user's privacy and consent
`,

    parameters: z.object({
      name: z.string().optional().describe("Full name of the contact"),
      email: z.string().email().optional().describe("Email address"),
      phone: z.string().optional().describe("Phone number"),
      productInterest: z
        .string()
        .optional()
        .describe("Product/service they're interested in"),
      position: z.string().optional().describe("Job title or position"),
      website: z.string().url().optional().describe("Company website"),
      notes: z.string().optional().describe("Additional relevant information"),
    }),

    execute: async (params) => {
      try {
        // Reutilizar handler existente
        const { saveContactInfoHandler } = await import(
          "@/server/tools/handlers/contact"
        );

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
        console.error("[Save Contact Tool] Error:", error);
        return `Hubo un problema al guardar la información de contacto: ${error instanceof Error ? error.message : "Error desconocido"}. Por favor intenta nuevamente.`;
      }
    },
  });
};
