import { db } from "~/utils/db.server";
import type { ParsingMode, ParsingStatus } from "@prisma/client";
import { LlamaParseReader } from "llama-cloud-services";
import { deleteParserFile } from "./upload.service";
import { validateAndDeduct } from "./credits.service";
import { countPDFPages, calculateCreditsForPages } from "./pdf-utils.server";

interface CreateParsingJobParams {
  chatbotId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mode: ParsingMode;
  options: any;
  fileBuffer: Buffer; // ⭐ Ahora necesitamos el buffer para contar páginas
}

interface ParsingResult {
  markdown: string;
  pages: number;
  processingTime: number;
}

/**
 * Crear un nuevo job de parsing
 * Ahora calcula créditos basado en número de páginas del PDF
 */
export async function createParsingJob(params: CreateParsingJobParams) {
  // 1. Contar páginas del PDF
  let pageCount = 10; // Fallback por defecto

  try {
    // Solo contar páginas si es PDF
    if (params.fileType === "application/pdf" || params.fileName.toLowerCase().endsWith(".pdf")) {
      pageCount = await countPDFPages(params.fileBuffer);
    } else {
      // Para otros formatos (DOCX, XLSX, TXT), asumir 5 páginas
      pageCount = 5;
    }
  } catch (error) {
    console.error("Error contando páginas, usando fallback:", error);
    pageCount = 10; // Fallback conservador
  }

  // 2. Calcular créditos según páginas
  const credits = calculateCreditsForPages(params.mode, pageCount);


  // 3. Validar y descontar créditos ANTES de crear el job
  await validateAndDeduct(params.userId, credits);

  try {
    const job = await db.parsingJob.create({
      data: {
        chatbotId: params.chatbotId,
        userId: params.userId,
        fileName: params.fileName,
        fileSize: params.fileSize,
        fileType: params.fileType,
        mode: params.mode,
        options: params.options,
        status: "PENDING",
        creditsUsed: credits,
        pages: pageCount, // Guardar páginas detectadas
      },
    });

    return job;
  } catch (error) {
    // Revertir créditos si falla la creación del job
    console.error(`Error creando parsing job, revirtiendo ${credits} créditos para user ${params.userId}`);

    // Necesitamos revertir usando la lógica dual (purchased + monthly)
    // Por simplicidad, aquí incrementamos solo purchased (debería ser más sofisticado)
    await db.user.update({
      where: { id: params.userId },
      data: {
        purchasedCredits: { increment: credits },
        lifetimeCreditsUsed: { decrement: credits },
      },
    }).catch((revertError) => {
      console.error("Error revirtiendo créditos:", revertError);
    });

    throw error;
  }
}

/**
 * Obtener jobs del usuario (historial)
 */
export async function getUserParsingJobs(userId: string, limit = 10) {
  const jobs = await db.parsingJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jobs;
}

/**
 * Obtener un job por ID
 */
export async function getParsingJobById(jobId: string) {
  const job = await db.parsingJob.findUnique({
    where: { id: jobId },
  });

  return job;
}

/**
 * Mapear modo de Formmy a configuración de LlamaParse
 */
function getParseConfig(mode: ParsingMode, options: any) {
  const baseConfig: any = {
    resultType: "markdown",
    verbose: false,
  };

  switch (mode) {
    case "COST_EFFECTIVE":
      return {
        ...baseConfig,
        // Modo simple y rápido
      };

    case "AGENTIC":
      return {
        ...baseConfig,
        // Modo balanceado con agent
        // @ts-ignore - LlamaParse types pueden no estar actualizados
        parseMode: "parse_page_with_agent",
        model: "openai-gpt-4-1-mini",
        adaptiveLongTable: options.extractTables,
        outlinedTableExtraction: options.extractTables,
        outputTablesAsHTML: options.preserveFormatting,
      };

    case "AGENTIC_PLUS":
      return {
        ...baseConfig,
        // Modo premium con alta precisión
        // @ts-ignore
        parseMode: "parse_page_with_agent",
        model: "openai-gpt-4-1-mini",
        highResOcr: options.extractImages,
        adaptiveLongTable: options.extractTables,
        outlinedTableExtraction: options.extractTables,
        outputTablesAsHTML: options.preserveFormatting,
      };

    default:
      return baseConfig;
  }
}

/**
 * ⚠️ NUNCA CAMBIAR ESTA BIBLIOTECA: unpdf es la opción correcta
 *
 * Razones:
 * - Diseñada específicamente para serverless/edge/workers
 * - Mantenida activamente (2025)
 * - Optimizada para Agenda.js background jobs
 * - Recomendada por la comunidad sobre pdf-parse
 *
 * Si hay errores de serialización, el problema es NUESTRO USO,
 * no la biblioteca. Asegurarse de retornar SOLO primitivos.
 */
async function basicParsing(fileUrl: string, fileName: string): Promise<ParsingResult> {
  const startTime = Date.now();

  try {

    // Descargar archivo
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    let markdown = "";
    let pages = 1;

    // Parsing básico según tipo de archivo
    if (fileName.toLowerCase().endsWith('.txt')) {
      markdown = buffer.toString('utf-8');
    } else if (fileName.toLowerCase().endsWith('.pdf')) {
      // ⚠️ unpdf: NO CAMBIAR - es la biblioteca correcta
      const { extractText } = await import('unpdf');

      // ✅ CRÍTICO: unpdf requiere Uint8Array, NO Buffer
      const uint8Array = new Uint8Array(buffer);

      // Extraer texto de todas las páginas
      const { text, totalPages } = await extractText(uint8Array, { mergePages: true });

      // ✅ CRÍTICO: Solo primitivos serializables
      markdown = String(text || ''); // Forzar string
      pages = Number(totalPages || 1); // Forzar number
    } else {
      // Para otros formatos, intentar leer como texto
      markdown = buffer.toString('utf-8');
    }

    const processingTime = (Date.now() - startTime) / 1000;

    // ✅ CRÍTICO: Garantizar que SOLO retornamos primitivos (string, number)
    // Esto evita errores de serialización en Agenda.js workers
    return {
      markdown: String(markdown),
      pages: Number(pages),
      processingTime: Number(parseFloat(processingTime.toFixed(2))),
    };
  } catch (error) {
    console.error("❌ Basic parsing error:", error);
    throw new Error(
      `Error in basic parsing: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Procesar documento con LlamaParse (modos avanzados)
 */
async function realParsing(
  fileUrl: string,
  fileName: string,
  mode: ParsingMode,
  options: any,
  llamaApiKey?: string // ⭐ Opcionalmente pasar la key
): Promise<ParsingResult> {
  const startTime = Date.now();

  try {
    // Usar key pasada como parámetro o fallback a env var
    const llamaKey = llamaApiKey || process.env.LLAMA_CLOUD_API_KEY;

    if (!llamaKey) {
      throw new Error("API Key is required for LlamaParseReader. Please pass the apiKey parameter or set the LLAMA_CLOUD_API_KEY environment variable.");
    }

    // Inicializar LlamaParse reader
    const reader = new LlamaParseReader({
      apiKey: llamaKey,
      ...getParseConfig(mode, options),
    });


    // Procesar documento
    const documents = await reader.loadData(fileUrl);

    // Extraer markdown de los documentos
    let markdown = "";
    let totalPages = 0;

    if (Array.isArray(documents)) {
      markdown = documents.map((doc) => doc.text || "").join("\n\n");
      totalPages = documents.length;
    } else {
      markdown = documents.text || "";
      totalPages = 1;
    }

    const processingTime = (Date.now() - startTime) / 1000;


    return {
      markdown,
      pages: totalPages,
      processingTime,
    };
  } catch (error) {
    console.error("❌ LlamaParse error:", error);
    throw new Error(
      `Error parsing document: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Procesar un job de parsing
 * Esta función será llamada por el worker/background processor
 */
export async function processParsingJob(
  jobId: string,
  fileUrl: string,
  fileKey: string,
  llamaApiKey?: string // ⭐ Parámetro opcional para la API key
) {
  try {
    // 1. Actualizar estado a PROCESSING
    const job = await db.parsingJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    // 2. Procesar documento según el modo
    const result = job.mode === "DEFAULT"
      ? await basicParsing(fileUrl, job.fileName) // DEFAULT = parsing básico gratis
      : await realParsing(fileUrl, job.fileName, job.mode, job.options, llamaApiKey); // Otros = LlamaParse

    // 3. Eliminar archivo temporal de S3
    await deleteParserFile(fileKey);

    // 4. Actualizar con resultado exitoso
    const completedJob = await db.parsingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        resultMarkdown: result.markdown,
        pages: result.pages,
        processingTime: result.processingTime,
        completedAt: new Date(),
      },
      select: {
        id: true,
        chatbotId: true,
        userId: true, // 🔒 Necesario para validación de ownership
        fileName: true,
        fileType: true,
        fileSize: true,
        mode: true,
        creditsUsed: true,
      },
    });

    // 5. Agregar contexto usando WRAPPER SEGURO con Vercel AI SDK
    if (completedJob.chatbotId && result.markdown) {
      try {
        // 🔒 USAR WRAPPER SEGURO con validación de ownership
        const { secureUpsert } = await import("server/context/vercel_embeddings.secure");

        const vectorResult = await secureUpsert({
          chatbotId: completedJob.chatbotId,
          title: completedJob.fileName,
          content: result.markdown,
          userId: completedJob.userId, // 🔒 Validación de ownership
          metadata: {
            contextType: 'FILE',
            fileName: completedJob.fileName,
            fileType: completedJob.fileType,
            fileSize: completedJob.fileSize,
            contextId: jobId, // Preserve parser job ID
            // Metadata de parsing
            parsingMode: completedJob.mode,
            parsingPages: result.pages,
            parsingCredits: completedJob.creditsUsed,
          },
        });

        // ✅ Success: Contexto creado exitosamente
        console.log(`✅ Context created: ${vectorResult.contextId}, ${vectorResult.chunksCreated} chunks vectorized`);
      } catch (vectorError) {
        console.error(`⚠️ Vectorization failed after retries:`, vectorError);

        // Actualizar estado a COMPLETED_NO_VECTOR
        await db.parsingJob.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED_NO_VECTOR",
            errorMessage: `Parsing successful but vectorization failed: ${
              vectorError instanceof Error ? vectorError.message : 'Unknown error'
            }`
          }
        });

        console.warn(`⚠️ Job ${jobId} marked as COMPLETED_NO_VECTOR - markdown available but not searchable`);
        return; // Exit early, don't throw
      }
    }

  } catch (error) {
    // 5. Manejar error
    console.error(`❌ Job ${jobId} failed:`, error);

    // Intentar limpiar archivo de S3 aunque haya fallado
    try {
      await deleteParserFile(fileKey);
    } catch (cleanupError) {
      console.error("Error cleaning up S3 file:", cleanupError);
    }

    await db.parsingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Error desconocido",
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Actualizar estado del job manualmente
 */
export async function updateJobStatus(
  jobId: string,
  status: ParsingStatus,
  errorMessage?: string
) {
  await db.parsingJob.update({
    where: { id: jobId },
    data: {
      status,
      errorMessage,
      ...(status === "COMPLETED" || status === "FAILED"
        ? { completedAt: new Date() }
        : {}),
    },
  });
}
