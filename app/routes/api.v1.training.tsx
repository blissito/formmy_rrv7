/**
 * 🎓 API v1 Training - Gestión de Contexts con Vercel AI SDK
 *
 * Esta API maneja TODOS los intents de entrenamiento de chatbots:
 * - upload_text: Texto plano
 * - upload_url: Website/links con scraping
 * - upload_file: Archivos (PDF, DOCX, TXT) con parsing básico GRATIS
 * - upload_file_advanced: PDF con LlamaParse (pago con créditos)
 * - upload_question: FAQ (preguntas + respuestas)
 * - delete: Eliminar context
 * - list: Listar contexts del chatbot
 *
 * 🔒 SEGURIDAD:
 * - Validación de ownership en TODAS las operaciones
 * - Defensa en profundidad (API + wrapper secure)
 * - Formato ObjectId validado
 * - Context pertenece al chatbot correcto
 */

import type { Route } from "./+types/api.v1.training";
import { getUserOrRedirect } from "@/server/getUserUtils.server";
import {
  secureUpsert,
  secureDeleteContext,
} from "@/server/context/vercel_embeddings.secure";
import { db } from "~/utils/db.server";

export async function action({ request }: Route.ActionArgs) {
  // 🔒 AUTENTICACIÓN REQUERIDA
  const user = await getUserOrRedirect(request);

  const {
    intent,
    chatbotId,
    content,
    title,
    url,
    file,
    mode,
    contextId,
    questions,
    answer,
  } = await request.json();

  // 🔒 VALIDAR QUE EL CHATBOT EXISTE Y ES DEL USUARIO
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId, userId: user.id },
    select: { id: true, userId: true },
  });

  if (!chatbot) {
    return Response.json(
      { success: false, error: "Chatbot no encontrado o acceso denegado" },
      { status: 403 }
    );
  }

  // 📍 ROUTER DE INTENTS
  try {
    switch (intent) {
      case "upload_text":
        return await handleUploadText(chatbotId, content, title, user.id);

      case "upload_url":
        return await handleUploadUrl(chatbotId, content, url, user.id);

      case "upload_file":
        return await handleUploadFile(chatbotId, file, user.id);

      case "upload_file_advanced":
        return await handleUploadFileAdvanced(chatbotId, file, mode, user);

      case "upload_question":
        return await handleUploadQuestion(
          chatbotId,
          questions,
          answer,
          user.id
        );

      case "delete":
        return await handleDelete(chatbotId, contextId, user.id);

      case "list":
        return await handleList(chatbotId, user.id);

      default:
        return Response.json(
          { success: false, error: `Intent inválido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[Training API] Error in ${intent}:`, error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 UPLOAD TEXT - Texto plano
 */
async function handleUploadText(
  chatbotId: string,
  content: string,
  title: string,
  userId: string
) {
  if (!content || !content.trim()) {
    return Response.json(
      { success: false, error: "El contenido no puede estar vacío" },
      { status: 400 }
    );
  }

  if (content.length < 50) {
    return Response.json(
      {
        success: false,
        error: "El contenido debe tener al menos 50 caracteres",
      },
      { status: 400 }
    );
  }

  try {
    const result = await secureUpsert({
      chatbotId,
      title: title || "Texto sin título",
      content,
      userId, // 🔒 Validación de ownership
      metadata: { contextType: "TEXT" },
    });

    return Response.json({
      success: true,
      contextId: result.contextId,
      chunksCreated: result.chunksCreated,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al guardar texto",
      },
      { status: 400 }
    );
  }
}

/**
 * 🌐 UPLOAD URL - Website con validación de duplicados
 */
async function handleUploadUrl(
  chatbotId: string,
  content: string,
  url: string,
  userId: string
) {
  if (!url || !url.trim()) {
    return Response.json(
      { success: false, error: "URL requerida" },
      { status: 400 }
    );
  }

  if (!content || content.length < 50) {
    return Response.json(
      {
        success: false,
        error:
          "El contenido scrapeado debe tener al menos 50 caracteres. Verifica que la URL sea accesible.",
      },
      { status: 400 }
    );
  }

  // 🔒 VALIDAR DUPLICADOS POR URL
  const existing = await db.context.findFirst({
    where: {
      chatbotId,
      metadata: { path: ["url"], equals: url },
    },
  });

  if (existing) {
    return Response.json(
      { success: false, error: "Esta URL ya fue agregada previamente" },
      { status: 409 }
    );
  }

  try {
    const result = await secureUpsert({
      chatbotId,
      title: url,
      content,
      userId, // 🔒 Validación
      metadata: { contextType: "LINK", url },
    });

    return Response.json({
      success: true,
      contextId: result.contextId,
      chunksCreated: result.chunksCreated,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al guardar URL",
      },
      { status: 400 }
    );
  }
}

/**
 * 📄 UPLOAD FILE - Parsing básico GRATIS (unpdf, officeparser)
 */
async function handleUploadFile(
  chatbotId: string,
  fileData: { name: string; content: string; type: string }, // base64
  userId: string
) {
  if (!fileData || !fileData.content) {
    return Response.json(
      { success: false, error: "Archivo requerido" },
      { status: 400 }
    );
  }

  // Convertir base64 a Buffer
  const buffer = Buffer.from(fileData.content, "base64");

  let text: string;

  try {
    // 📄 PDF - Usar unpdf (GRATIS)
    if (fileData.type === "application/pdf") {
      const { extractText } = await import("unpdf");
      const extracted = await extractText(buffer);
      text = extracted.text;
    }
    // 📝 DOCX/XLSX - Usar officeparser (GRATIS)
    else if (
      fileData.type.includes("officedocument") ||
      fileData.type.includes("msword")
    ) {
      const officeParser = await import("officeparser");
      text = await officeParser.parseOfficeAsync(buffer);
    }
    // 📋 TXT - Decodificar directamente
    else if (fileData.type === "text/plain") {
      text = new TextDecoder().decode(buffer);
    } else {
      return Response.json(
        {
          success: false,
          error: `Tipo de archivo no soportado: ${fileData.type}. Soportados: PDF, DOCX, TXT`,
        },
        { status: 400 }
      );
    }

    // Validar que se extrajo texto
    if (!text || text.trim().length < 50) {
      return Response.json(
        {
          success: false,
          error:
            "No se pudo extraer suficiente texto del archivo. Intenta con parsing avanzado (LlamaParse).",
        },
        { status: 400 }
      );
    }

    const result = await secureUpsert({
      chatbotId,
      title: fileData.name,
      content: text,
      userId, // 🔒 Validación
      metadata: {
        contextType: "FILE",
        fileName: fileData.name,
        fileType: fileData.type,
        fileSize: buffer.length,
        parsingMode: "DEFAULT",
      },
    });

    return Response.json({
      success: true,
      contextId: result.contextId,
      chunksCreated: result.chunksCreated,
      extractedChars: text.length,
    });
  } catch (error) {
    console.error("[Upload File] Parsing error:", error);
    return Response.json(
      {
        success: false,
        error: `Error al procesar archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 }
    );
  }
}

/**
 * 🚀 UPLOAD FILE ADVANCED - LlamaParse con créditos (PAGO)
 */
async function handleUploadFileAdvanced(
  chatbotId: string,
  fileData: { name: string; content: string; type: string }, // base64
  mode: "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS",
  user: any
) {
  // Solo PDF soportado para parsing avanzado
  if (fileData.type !== "application/pdf") {
    return Response.json(
      {
        success: false,
        error: "Parsing avanzado solo soporta PDFs. Usa upload_file para otros formatos.",
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(fileData.content, "base64");

  try {
    // 🔢 CONTAR PÁGINAS
    const { countPDFPages, calculateCreditsForPages } = await import(
      "@/server/llamaparse/pdf-utils.server"
    );
    const pages = await countPDFPages(buffer);

    // 💰 CALCULAR Y VALIDAR CRÉDITOS
    const credits = calculateCreditsForPages(mode, pages);
    const { validateAndDeduct } = await import(
      "@/server/llamaparse/credits.service"
    );
    const validation = await validateAndDeduct(user.id, credits);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          error: `Créditos insuficientes. Necesitas ${credits} créditos (${pages} páginas × modo ${mode}). ${validation.error}`,
        },
        { status: 402 }
      );
    }

    // 📋 CREAR JOB DE PARSING (procesamiento asíncrono)
    const { createParsingJob } = await import(
      "@/server/llamaparse/job.service"
    );
    const job = await createParsingJob({
      userId: user.id,
      chatbotId,
      fileName: fileData.name,
      fileSize: buffer.length,
      mode,
      pages,
    });

    // ☁️ UPLOAD A S3 TEMPORAL
    const { uploadParserFile } = await import(
      "@/server/llamaparse/upload.service"
    );
    await uploadParserFile(buffer, job.id);

    // ⚙️ ENQUEUE WORKER (procesará en background)
    const { enqueueParsingJob } = await import(
      "@/server/llamaparse/job.service"
    );
    await enqueueParsingJob(job.id);

    return Response.json({
      success: true,
      jobId: job.id,
      status: "PENDING",
      pages,
      credits,
      message: `Tu documento está siendo procesado. Esto puede tomar unos minutos para ${pages} páginas.`,
    });
  } catch (error) {
    console.error("[Upload File Advanced] Error:", error);
    return Response.json(
      {
        success: false,
        error: `Error en parsing avanzado: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 }
    );
  }
}

/**
 * ❓ UPLOAD QUESTION - FAQ (preguntas + respuesta)
 */
async function handleUploadQuestion(
  chatbotId: string,
  questions: string,
  answer: string,
  userId: string
) {
  if (!questions || !questions.trim()) {
    return Response.json(
      { success: false, error: "Las preguntas no pueden estar vacías" },
      { status: 400 }
    );
  }

  if (!answer || !answer.trim()) {
    return Response.json(
      { success: false, error: "La respuesta no puede estar vacía" },
      { status: 400 }
    );
  }

  // Combinar preguntas y respuesta en el contenido
  const content = `Preguntas: ${questions}\n\nRespuesta: ${answer}`;

  try {
    const result = await secureUpsert({
      chatbotId,
      title: questions.substring(0, 50) + (questions.length > 50 ? "..." : ""),
      content,
      userId, // 🔒 Validación
      metadata: {
        contextType: "QUESTION",
        questions,
        answer,
      },
    });

    return Response.json({
      success: true,
      contextId: result.contextId,
      chunksCreated: result.chunksCreated,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al guardar pregunta",
      },
      { status: 400 }
    );
  }
}

/**
 * 🗑️ DELETE - Eliminar context
 */
async function handleDelete(
  chatbotId: string,
  contextId: string,
  userId: string
) {
  if (!contextId) {
    return Response.json(
      { success: false, error: "contextId requerido" },
      { status: 400 }
    );
  }

  try {
    await secureDeleteContext({
      contextId,
      chatbotId,
      userId, // 🔒 Validación completa
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar",
      },
      { status: 403 }
    );
  }
}

/**
 * 📋 LIST - Listar contexts del chatbot
 */
async function handleList(chatbotId: string, userId: string) {
  try {
    // 🔒 DOBLE FILTRO: chatbotId + userId (defensa en profundidad)
    const contexts = await db.context.findMany({
      where: {
        chatbotId,
        chatbot: { userId }, // ⭐ GARANTIZA que solo ve sus chatbots
      },
      select: {
        id: true,
        title: true,
        contextType: true,
        metadata: true,
        createdAt: true,
        _count: { select: { embeddings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      contexts: contexts.map((ctx) => ({
        id: ctx.id,
        title: ctx.title,
        type: ctx.contextType,
        metadata: ctx.metadata,
        chunks: ctx._count.embeddings,
        createdAt: ctx.createdAt,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al listar",
      },
      { status: 500 }
    );
  }
}
