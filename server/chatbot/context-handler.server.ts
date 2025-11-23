/**
 * Context Handler - Maneja todas las operaciones de contexto para chatbots
 * Modularización de operaciones de contexto desde API v1
 */

import {
  removeContextItem,
  getChatbotContexts,
  getChatbotById,
} from "../chatbot-api.server";
import { secureUpsert } from "../context/vercel_embeddings.secure";
import { db } from "../../app/utils/db.server";
import * as officeParser from "officeparser";
import { extractText } from "unpdf";

export async function handleContextOperation(
  intent: string,
  formData: FormData,
  userId: string
): Promise<Response> {

  try {
    switch (intent) {
      case "add_file_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const fileName = formData.get("fileName") as string;
        const fileType = formData.get("fileType") as string;
        const fileUrl = formData.get("fileUrl") as string;
        const sizeKB = Number(formData.get("sizeKB"));
        const file = formData.get("file") as File | null;

        let content: string | undefined;

        if (file) {
          try {
            // Extraer contenido basado en el tipo de archivo
            if (
              fileType === "application/pdf" ||
              (fileName && fileName.toLowerCase().endsWith(".pdf"))
            ) {
              // Procesar PDF con unpdf
              const arrayBuffer = await file.arrayBuffer();

              try {
                // unpdf es muy simple: solo necesita el arrayBuffer
                const result = await extractText(arrayBuffer);

                // Manejar diferentes posibles estructuras
                if (typeof result === "string") {
                  content = result.trim();
                } else if (result && typeof result.text === "string") {
                  content = result.text.trim();
                } else if (
                  result &&
                  Array.isArray(result.text) &&
                  result.text.length > 0
                ) {
                  // unpdf devuelve { totalPages: N, text: ["página1", "página2", ...] }
                  // Unir todas las páginas con doble salto de línea para separarlas claramente
                  content = result.text
                    .map(
                      (page: string, index: number) =>
                        `=== PÁGINA ${index + 1} ===\n${page.trim()}`
                    )
                    .join("\n\n")
                    .trim();
                } else if (result && Array.isArray(result)) {
                  content = result.join("\n\n").trim();
                } else if (result && typeof result === "object") {
                  // Si es un objeto, intentar encontrar el texto
                  content = JSON.stringify(result);
                } else {
                  content = String(result || "").trim();
                }

                // Validar que se extrajo contenido real
                if (!content || content.trim().length === 0) {
                  throw new Error(
                    "El archivo PDF está vacío o no contiene texto extraíble"
                  );
                }
              } catch (pdfError) {
                // NO guardar el archivo si el parsing falla
                const errorMessage =
                  pdfError instanceof Error
                    ? pdfError.message
                    : "Error desconocido";
                throw new Error(
                  `No se pudo procesar el archivo PDF "${fileName}": ${errorMessage}. Verifica que el PDF no esté protegido o corrupto.`
                );
              }
            } else if (fileName && fileName.toLowerCase().endsWith(".docx")) {
              // Procesar DOCX con officeParser
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              try {
                content = await officeParser.parseOfficeAsync(buffer);

                // Validar que se extrajo contenido real
                if (!content || content.trim().length === 0) {
                  throw new Error(
                    "El archivo .docx está vacío o no contiene texto extraíble"
                  );
                }
              } catch (docxError) {
                // NO guardar el archivo si el parsing falla
                const errorMessage =
                  docxError instanceof Error
                    ? docxError.message
                    : "Error desconocido";
                throw new Error(
                  `No se pudo procesar el archivo .docx "${fileName}": ${errorMessage}. Intenta con otro formato (PDF, TXT) o verifica que el archivo no esté corrupto.`
                );
              }
            } else if (fileName && fileName.toLowerCase().endsWith(".xlsx")) {
              // Procesar XLSX con officeParser
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              try {
                content = await officeParser.parseOfficeAsync(buffer);

                // Validar que se extrajo contenido real
                if (!content || content.trim().length === 0) {
                  throw new Error(
                    "El archivo Excel está vacío o no contiene datos extraíbles"
                  );
                }
              } catch (xlsxError) {
                // NO guardar el archivo si el parsing falla
                const errorMessage =
                  xlsxError instanceof Error
                    ? xlsxError.message
                    : "Error desconocido";
                throw new Error(
                  `No se pudo procesar el archivo Excel "${fileName}": ${errorMessage}. Verifica que el archivo no esté corrupto.`
                );
              }
            } else if (
              fileType.includes("text") ||
              (fileName && fileName.toLowerCase().endsWith(".txt")) ||
              (fileName && fileName.toLowerCase().endsWith(".csv"))
            ) {
              // Archivos de texto plano
              content = await file.text();
            } else {
              // Fallback: intentar leer como texto
              try {
                content = await file.text();
              } catch (textError) {
                content = `[ERROR_TEXT: No se pudo leer el archivo ${fileName}]`;
              }
            }
          } catch (error) {
            content = `[ERROR: No se pudo procesar el archivo ${fileName}]`;
          }
        } else {
          // Fallback al contenido enviado directamente (compatibilidad)
          content = formData.get("content") as string | undefined;
        }

        // ✅ Usar Vercel AI SDK para vectorización automática
        const result = await secureUpsert({
          chatbotId,
          userId,
          title: fileName || "Unnamed file",
          content: content || "",
          metadata: {
            contextType: "FILE",
            fileName,
            fileType,
            fileSize: sizeKB * 1024, // Convertir KB a bytes
          },
        });

        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: result.error?.message || "Error al procesar archivo",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Obtener chatbot actualizado para retornar
        const chatbot = await getChatbotById(chatbotId);

        return new Response(
          JSON.stringify({
            success: true,
            chatbot,
            embeddingsCreated: result.embeddingsCreated,
            embeddingsSkipped: result.embeddingsSkipped,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "add_url_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const url = formData.get("url") as string;
        const title = formData.get("title") as string | undefined;
        const content = formData.get("content") as string;
        const sizeKB = formData.get("sizeKB")
          ? Number(formData.get("sizeKB"))
          : undefined;
        const routesData = formData.get("routes") as string | undefined;
        const routes = routesData ? JSON.parse(routesData) : undefined;

        // ✅ Validar que content no esté vacío
        if (!content || content.trim().length === 0) {
          return new Response(
            JSON.stringify({
              error: "No se pudo extraer contenido del sitio web. Verifica que la URL sea accesible y contenga texto."
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Validar contenido mínimo (al menos 50 caracteres)
        if (content.trim().length < 50) {
          return new Response(
            JSON.stringify({
              error: "El contenido extraído es demasiado corto. Asegúrate de que el sitio web tenga texto suficiente."
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Usar Vercel AI SDK para vectorización automática
        const result = await secureUpsert({
          chatbotId,
          userId,
          title: title || url,
          content,
          metadata: {
            contextType: "LINK",
            url,
            title,
            fileSize: sizeKB ? sizeKB * 1024 : undefined, // Convertir KB a bytes
            routes,
          },
        });

        console.log(`📊 [context-handler] Resultado de addContextWithEmbeddings:`, {
          success: result.success,
          embeddingsCreated: result.success ? result.embeddingsCreated : 0,
          embeddingsSkipped: result.success ? result.embeddingsSkipped : 0,
          error: result.error,
        });

        if (!result.success) {
          console.log(`❌ [context-handler] Retornando error 400 al cliente`);
          return new Response(
            JSON.stringify({ error: result.error?.message || "Error al procesar URL" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log(`✅ [context-handler] Success, retornando chatbot actualizado`);

        // Obtener chatbot actualizado para retornar
        const chatbot = await getChatbotById(chatbotId);

        return new Response(
          JSON.stringify({
            success: true,
            chatbot,
            embeddingsCreated: result.embeddingsCreated,
            embeddingsSkipped: result.embeddingsSkipped,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "add_text_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        // ✅ Usar Vercel AI SDK para vectorización automática
        const result = await secureUpsert({
          chatbotId,
          userId,
          title: title || "Untitled text",
          content: content || "",
          metadata: {
            contextType: "TEXT",
            title,
          },
        });

        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: result.error?.message || "Error al procesar texto",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Obtener chatbot actualizado para retornar
        const chatbot = await getChatbotById(chatbotId);

        return new Response(
          JSON.stringify({
            success: true,
            chatbot,
            embeddingsCreated: result.embeddingsCreated,
            embeddingsSkipped: result.embeddingsSkipped,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "update_text_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        // 🔒 SECURITY: Validar ownership
        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          select: { userId: true },
        });

        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Buscar contexto en modelo Context
        const existingContext = await db.context.findFirst({
          where: {
            id: contextId,
            chatbotId,
          },
        });

        if (!existingContext) {
          return new Response(
            JSON.stringify({ error: "Contexto no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Actualizar Context y re-generar embeddings si el contenido cambió
        const contentChanged = existingContext.content !== content;

        if (contentChanged) {
          // Si el contenido cambió, eliminar embeddings viejos y crear nuevos
          await db.embedding.deleteMany({
            where: { contextId },
          });

          // Actualizar contexto con nuevo contenido
          await db.context.update({
            where: { id: contextId },
            data: {
              title,
              content,
              embeddingIds: [], // Reset embedding IDs
            },
          });

          // Re-generar embeddings usando secureUpsert en modo update
          const { updateContext } = await import("../context/vercel_embeddings");
          await updateContext({
            contextId,
            chatbotId,
            content,
            title,
          });
        } else {
          // Solo actualizar título (sin re-generar embeddings)
          await db.context.update({
            where: { id: contextId },
            data: { title },
          });
        }

        const updatedChatbot = await getChatbotById(chatbotId);
        return new Response(JSON.stringify({ success: true, chatbot: updatedChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "add_question_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const title = formData.get("title") as string;
        const questions = formData.get("questions") as string;
        const answer = formData.get("answer") as string;

        // ✅ Usar Vercel AI SDK para vectorización automática
        // Combinar preguntas y respuesta para vectorización
        const content = `Preguntas: ${questions}\n\nRespuesta: ${answer}`;

        const result = await secureUpsert({
          chatbotId,
          userId,
          title: title || questions.substring(0, 50) + "...",
          content,
          metadata: {
            contextType: "QUESTION",
            title,
            questions,
            answer,
          },
        });

        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: result.error?.message || "Error al procesar pregunta",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Obtener chatbot actualizado para retornar
        const chatbot = await getChatbotById(chatbotId);

        return new Response(
          JSON.stringify({
            success: true,
            chatbot,
            embeddingsCreated: result.embeddingsCreated,
            embeddingsSkipped: result.embeddingsSkipped,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "update_question_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;
        const title = formData.get("title") as string;
        const questions = formData.get("questions") as string;
        const answer = formData.get("answer") as string;

        // 🔒 SECURITY: Validar ownership
        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          select: { userId: true },
        });

        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Buscar contexto en modelo Context
        const existingContext = await db.context.findFirst({
          where: {
            id: contextId,
            chatbotId,
          },
        });

        if (!existingContext) {
          return new Response(
            JSON.stringify({ error: "Contexto no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // Combinar preguntas y respuesta para vectorización
        const newContent = `Preguntas: ${questions}\n\nRespuesta: ${answer}`;
        const contentChanged = existingContext.content !== newContent;

        if (contentChanged) {
          // Eliminar embeddings viejos
          await db.embedding.deleteMany({
            where: { contextId },
          });

          // Actualizar contexto
          await db.context.update({
            where: { id: contextId },
            data: {
              title,
              content: newContent,
              embeddingIds: [],
              metadata: {
                contextType: "QUESTION",
                title,
                questions,
                answer,
              },
            },
          });

          // Re-generar embeddings
          const { updateContext } = await import("../context/vercel_embeddings");
          await updateContext({
            contextId,
            chatbotId,
            content: newContent,
            title,
          });
        } else {
          // Solo actualizar metadata y título
          await db.context.update({
            where: { id: contextId },
            data: {
              title,
              metadata: {
                contextType: "QUESTION",
                title,
                questions,
                answer,
              },
            },
          });
        }

        const updatedChatbot = await getChatbotById(chatbotId);
        return new Response(JSON.stringify({ success: true, chatbot: updatedChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "remove_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextItemId = formData.get("contextItemId") as string;

        // 🔒 SECURITY: Validar ownership del chatbot antes de eliminar
        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          select: { userId: true },
        });

        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para eliminar este contexto",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        await removeContextItem(chatbotId, contextItemId);
        const updatedChatbot = await getChatbotById(chatbotId);

        return new Response(
          JSON.stringify({ success: true, chatbot: updatedChatbot }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "rename_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextItemId = formData.get("contextItemId") as string;
        const newFileName = formData.get("newFileName") as string;

        if (!newFileName || !newFileName.trim()) {
          return new Response(
            JSON.stringify({ error: "Nombre de archivo requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // 🔒 SECURITY: Validar ownership del chatbot
        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          select: { id: true, userId: true },
        });

        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Buscar contexto en el modelo Context
        const context = await db.context.findFirst({
          where: {
            id: contextItemId,
            chatbotId,
          },
        });

        if (!context) {
          return new Response(
            JSON.stringify({ error: "Contexto no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // ✅ Actualizar fileName en metadata del modelo Context
        const currentMetadata = (context.metadata as any) || {};
        const updatedMetadata = {
          ...currentMetadata,
          fileName: newFileName.trim(),
        };

        await db.context.update({
          where: { id: contextItemId },
          data: {
            metadata: updatedMetadata,
          },
        });

        // ✅ Retornar chatbot actualizado
        const updatedChatbot = await getChatbotById(chatbotId);

        return new Response(
          JSON.stringify({ success: true, chatbot: updatedChatbot }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "get_contexts": {
        const chatbotId = formData.get("chatbotId") as string;

        // Verificar que el chatbot pertenece al usuario
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para ver este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const contexts = await getChatbotContexts(chatbotId);
        return new Response(JSON.stringify({ success: true, contexts }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Intent de contexto no soportado" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error(`❌ Error en ${intent}:`, error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error interno del servidor",
        intent,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
