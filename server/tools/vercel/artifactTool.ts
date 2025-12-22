/**
 * Artifact Tool - Abre componentes interactivos en el chat
 *
 * Permite al agente mostrar artefactos (componentes React) interactivos
 * como formularios, calendarios, selectores, etc.
 *
 * SEGURIDAD:
 * - chatbotId capturado en CLOSURE (no modificable por modelo)
 * - Solo puede abrir artefactos instalados y activos en el chatbot
 * - Actualiza stats de uso automáticamente
 *
 * USO:
 * - El modelo detecta cuando necesita mostrar UI interactiva
 * - Llama este tool con el nombre del artefacto
 * - El frontend renderiza el componente
 */

import { tool } from "ai";
import { z } from "zod";
import { db } from "~/utils/db.server";
import { getNativeArtifact } from "../../artifacts/native/index.js";
import { vectorSearch } from "@/server/context/vercel_embeddings";

/**
 * Extrae URLs de imágenes de un texto
 */
function extractImageUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(?:jpg|jpeg|png|gif|webp|svg)/gi;
  const matches = text.match(urlPattern) || [];
  // Dedupe y limitar a 4
  return [...new Set(matches)].slice(0, 4);
}

/**
 * Factory function que crea el tool con chatbotId en closure
 *
 * @param chatbotId - ID del chatbot (capturado en closure)
 * @returns Tool de Vercel AI SDK
 */
export const createOpenArtifactTool = (chatbotId: string) => {
  // VALIDAR FORMATO AL CREAR EL TOOL
  if (!/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    throw new Error(`[Artifact Tool] chatbotId inválido: ${chatbotId}`);
  }

  return tool({
    description: `Abre un artefacto interactivo en el chat.

⚠️ IMPORTANTE: Después de llamar este tool, DEBES llamar inmediatamente a confirmArtifactTool
para esperar la respuesta del usuario. NO respondas hasta recibir la confirmación.

CUANDO USAR:
- Usuario necesita llenar un formulario
- Usuario necesita seleccionar fecha/hora
- Usuario necesita interactuar con un componente visual
- Usuario necesita ver datos estructurados en un widget

ARTEFACTOS DISPONIBLES:
Los artefactos disponibles están pre-instalados por el dueño del chatbot.
Usa el nombre técnico del artefacto (slug) para abrirlo.

FLUJO OBLIGATORIO:
1. Llama openArtifactTool con el nombre del artefacto
2. INMEDIATAMENTE llama confirmArtifactTool para esperar respuesta
3. Cuando recibas la confirmación, responde apropiadamente
4. NUNCA vuelvas a llamar openArtifactTool después de recibir confirmación

EJEMPLOS:
- "date-picker" para selector de fecha/hora
- "payment-form" para formulario de pago
- "product-gallery" para galería de productos`,

    inputSchema: z.object({
      artifactName: z
        .string()
        .describe("Nombre técnico del artefacto (slug, ej: date-picker)"),
      initialDataJson: z
        .string()
        .optional()
        .describe("Datos iniciales en formato JSON string (ej: '{\"minDate\":\"2025-01-01\"}')"),
    }),

    execute: async ({ artifactName, initialDataJson }: { artifactName: string; initialDataJson?: string }) => {
      console.log(`[Artifact Tool] Opening: ${artifactName}`);
      console.log(`[Artifact Tool] initialDataJson:`, initialDataJson);

      // Parse initialData from JSON string
      let initialData: Record<string, unknown> = {};
      if (initialDataJson) {
        try {
          initialData = JSON.parse(initialDataJson);
          console.log(`[Artifact Tool] Parsed data:`, initialData);
        } catch {
          console.warn("[Artifact Tool] Invalid JSON in initialDataJson:", initialDataJson);
        }
      } else {
        console.warn(`[Artifact Tool] ⚠️ No initialDataJson provided for ${artifactName}`);
      }
      try {
        // Verificar que está instalado y activo
        const installation = await db.artifactInstallation.findFirst({
          where: {
            chatbotId,
            artifact: { name: artifactName },
            isActive: true,
          },
          include: { artifact: true },
        });

        if (!installation) {
          return {
            error: `Artefacto "${artifactName}" no instalado o no activo.`,
            availableArtifacts: await getAvailableArtifactNames(chatbotId),
          };
        }

        // Actualizar stats de uso (async, no bloquea)
        db.artifactInstallation.update({
          where: { id: installation.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        }).catch((err) => console.error("[Artifact Tool] Stats update error:", err));

        const { artifact } = installation;
        const configData = (installation.config as Record<string, unknown>) ?? {};
        let initData = initialData ?? {};

        // 🖼️ FALLBACK para gallery-card: Si no tiene imágenes, buscar automáticamente en RAG
        if (artifact.name === "gallery-card") {
          const images = initData.images as string[] | undefined;
          if (!images || images.length === 0) {
            console.log("[Artifact Tool] gallery-card sin imágenes, buscando en RAG...");
            try {
              const ragResult = await vectorSearch({
                chatbotId,
                value: "imágenes galería fotos",
              });
              if (ragResult.success && ragResult.results && ragResult.results.length > 0) {
                const text = ragResult.results.map((r: any) => r.content).join("\n");
                const foundUrls = extractImageUrls(text);
                console.log("[Artifact Tool] URLs encontradas en RAG:", foundUrls);
                if (foundUrls.length > 0) {
                  initData = { ...initData, images: foundUrls };
                }
              }
            } catch (err) {
              console.error("[Artifact Tool] Error buscando imágenes en RAG:", err);
            }
          }
        }

        // Si es nativo → código SIEMPRE del registry (no de DB)
        if (artifact.isNative) {
          const native = getNativeArtifact(artifact.name);
          if (native) {
            return {
              type: "artifact" as const,
              name: artifact.name,
              displayName: native.metadata.displayName,
              code: native.code,
              compiledCode: native.compiledCode,
              data: { ...configData, ...initData },
              events: native.metadata.events,
              propsSchema: native.metadata.propsSchema,
            };
          }
        }

        // Si no es nativo → código de DB (marketplace)
        return {
          type: "artifact" as const,
          name: artifactName,
          displayName: artifact.displayName,
          code: artifact.code,
          compiledCode: artifact.compiledCode,
          data: { ...configData, ...initData },
          events: artifact.events,
          propsSchema: artifact.propsSchema,
        };
      } catch (error) {
        console.error("[Artifact Tool] Error:", error);
        return {
          error: "Error al cargar el artefacto. Intenta de nuevo.",
        };
      }
    },
  });
};

/**
 * Obtener nombres de artefactos disponibles para el chatbot
 */
async function getAvailableArtifactNames(chatbotId: string): Promise<string[]> {
  const installations = await db.artifactInstallation.findMany({
    where: {
      chatbotId,
      isActive: true,
    },
    include: {
      artifact: {
        select: { name: true },
      },
    },
  });

  return installations.map((inst) => inst.artifact.name);
}

/**
 * Artifact Confirmation Tool - HITL pattern
 *
 * Tool SIN execute function para capturar la respuesta del usuario
 * después de interactuar con un artefacto.
 *
 * Sigue el patrón Human-in-the-Loop de Vercel AI SDK:
 * https://ai-sdk.dev/cookbook/next/human-in-the-loop
 *
 * Flujo:
 * 1. openArtifactTool ejecuta y retorna el código del artefacto
 * 2. Frontend renderiza el artefacto interactivo
 * 3. Usuario interactúa y confirma
 * 4. Frontend usa addToolOutput() para enviar la confirmación
 * 5. El modelo recibe el resultado y puede responder
 */
export const createConfirmArtifactTool = () => {
  return tool({
    description: `Captura la respuesta del usuario después de interactuar con un artefacto.

IMPORTANTE: Este tool se usa AUTOMÁTICAMENTE después de openArtifactTool.
- Después de abrir un artefacto, SIEMPRE llama a este tool para esperar la respuesta del usuario.
- NO ejecutes ninguna acción hasta que el usuario confirme o cancele.
- El frontend capturará la respuesta del usuario automáticamente.

FLUJO:
1. Llamas openArtifactTool para mostrar el artefacto
2. Llamas confirmArtifactTool para esperar la respuesta
3. Cuando el usuario confirme/cancele, recibirás el resultado
4. Responde apropiadamente basándote en la decisión del usuario`,

    inputSchema: z.object({
      artifactName: z
        .string()
        .describe("Nombre del artefacto que espera confirmación"),
      expectedEvent: z
        .string()
        .optional()
        .describe("Evento esperado (ej: 'onConfirm', 'onCancel', 'onSubmit')"),
    }),

    // SIN execute function - HITL pattern
    // El frontend usa addToolOutput() para enviar el resultado
  });
};

/**
 * Helper: Obtener lista de artefactos instalados para system prompt
 *
 * Útil para inyectar la lista de artefactos disponibles en el prompt del sistema
 */
export async function getInstalledArtifactsForPrompt(
  chatbotId: string
): Promise<string> {
  const installations = await db.artifactInstallation.findMany({
    where: {
      chatbotId,
      isActive: true,
    },
    include: {
      artifact: {
        select: {
          name: true,
          displayName: true,
          description: true,
          events: true,
        },
      },
    },
  });

  if (installations.length === 0) {
    return "No hay artefactos instalados.";
  }

  return installations
    .map((inst) => {
      const { artifact } = inst;
      const eventsStr =
        artifact.events.length > 0
          ? `\n   Eventos: ${artifact.events.join(", ")}`
          : "";
      return `- ${artifact.name}: ${artifact.description}${eventsStr}`;
    })
    .join("\n");
}
