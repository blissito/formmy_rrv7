/**
 * Context Handler - Maneja todas las operaciones de contexto para chatbots
 * Modularización de operaciones de contexto desde API v1
 */

export async function handleContextOperation(
  intent: string,
  formData: FormData,
  userId: string
): Promise<Response> {
  // Imports dinámicos para optimización
  const {
    addFileContext,
    addUrlContext,
    addTextContext,
    addQuestionContext,
    updateTextContext,
    updateQuestionContext,
    removeContextItem,
    getChatbotContexts,
    getChatbotById,
  } = await import("../chatbot-api.server");

  const { mammoth } = await import("mammoth");
  const { default: XLSX } = await import("xlsx");

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
                const { extractText } = await import("unpdf");

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
              } catch (pdfError) {
                // No hay fallback necesario con pdf2json
                content = `[ERROR_PDF: ${pdfError instanceof Error ? pdfError.message : "Error desconocido"} - archivo: ${fileName}]`;
              }
            } else if (fileName && fileName.toLowerCase().endsWith(".docx")) {
              // Procesar DOCX con mammoth
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              try {
                const result = await mammoth.extractRawText({ buffer });
                content = result.value;
              } catch (docxError) {
                content = `[ERROR_DOCX: No se pudo extraer texto del archivo ${fileName}]`;
              }
            } else if (fileName && fileName.toLowerCase().endsWith(".xlsx")) {
              // Procesar XLSX con xlsx
              const arrayBuffer = await file.arrayBuffer();

              try {
                const workbook = XLSX.read(arrayBuffer, { type: "array" });
                let allText = "";

                workbook.SheetNames.forEach((sheetName) => {
                  const worksheet = workbook.Sheets[sheetName];
                  const csvData = XLSX.utils.sheet_to_csv(worksheet);
                  allText += `\n--- Hoja: ${sheetName} ---\n${csvData}\n`;
                });

                content = allText.trim();
              } catch (xlsxError) {
                content = `[ERROR_XLSX: No se pudo extraer datos del archivo ${fileName}]`;
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

        const chatbot = await addFileContext(chatbotId, {
          fileName,
          fileType,
          fileUrl,
          sizeKB,
          content,
        });

        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "add_url_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const url = formData.get("url") as string;
        const title = formData.get("title") as string | undefined;
        const content = formData.get("content") as string | undefined;
        const sizeKB = formData.get("sizeKB")
          ? Number(formData.get("sizeKB"))
          : undefined;
        const routesData = formData.get("routes") as string | undefined;
        const routes = routesData ? JSON.parse(routesData) : undefined;

        const chatbot = await addUrlContext(chatbotId, {
          url,
          title,
          content,
          sizeKB,
          routes,
        });
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "add_text_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        const chatbot = await addTextContext(chatbotId, { title, content });
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "update_text_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        const chatbot = await updateTextContext(chatbotId, contextId, {
          title,
          content,
        });
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "add_question_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const title = formData.get("title") as string;
        const questions = formData.get("questions") as string;
        const answer = formData.get("answer") as string;

        const chatbot = await addQuestionContext(chatbotId, {
          title,
          questions,
          answer,
        });
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "update_question_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;
        const title = formData.get("title") as string;
        const questions = formData.get("questions") as string;
        const answer = formData.get("answer") as string;

        const chatbot = await updateQuestionContext(chatbotId, contextId, {
          title,
          questions,
          answer,
        });
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "remove_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextItemId = formData.get("contextItemId") as string;

        const chatbot = await removeContextItem(chatbotId, contextItemId);
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
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

        // Obtener chatbot con contexts
        const { db } = await import("~/utils/db.server");
        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          select: { id: true, userId: true, contexts: true }
        });

        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso para modificar este chatbot" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // Actualizar el fileName en el array de contexts
        const updatedContexts = chatbot.contexts.map((ctx: any) =>
          ctx.id === contextItemId
            ? { ...ctx, fileName: newFileName.trim() }
            : ctx
        );

        const updatedChatbot = await db.chatbot.update({
          where: { id: chatbotId },
          data: {
            contexts: updatedContexts
          }
        });

        return new Response(JSON.stringify({ success: true, chatbot: updatedChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "get_contexts": {
        const chatbotId = formData.get("chatbotId") as string;

        // Verificar que el chatbot pertenece al usuario
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot || chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso para ver este chatbot" }),
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
        intent
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}