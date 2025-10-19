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
      console.log(`📄 PDF detectado: ${params.fileName} tiene ${pageCount} páginas`);
    } else {
      // Para otros formatos (DOCX, XLSX, TXT), asumir 5 páginas
      pageCount = 5;
      console.log(`📄 Documento no-PDF: ${params.fileName}, asumiendo ${pageCount} páginas`);
    }
  } catch (error) {
    console.error("Error contando páginas, usando fallback:", error);
    pageCount = 10; // Fallback conservador
  }

  // 2. Calcular créditos según páginas
  const credits = calculateCreditsForPages(params.mode, pageCount);

  console.log(`💎 Créditos calculados: ${credits} (${params.mode}, ${pageCount} páginas)`);

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
 * Procesar documento con LlamaParse real
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

    console.log(`📄 Parsing ${fileName} with mode ${mode}...`);

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

    console.log(`✅ Parsed ${totalPages} pages in ${processingTime.toFixed(2)}s`);

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

    // 2. Procesar documento con LlamaParse real
    const result = await realParsing(
      fileUrl,
      job.fileName,
      job.mode,
      job.options,
      llamaApiKey // ⭐ Pasar la key
    );

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
    });

    // 5. Agregar a contexts[] del chatbot (Single Source of Truth)
    if (completedJob.chatbotId && result.markdown) {
      console.log(`📝 Adding ParsingJob ${jobId} to chatbot.contexts[]`);

      const chatbot = await db.chatbot.findUnique({
        where: { id: completedJob.chatbotId },
        select: { contexts: true }
      });

      const existingContexts = (chatbot?.contexts || []) as any[];

      // Agregar nuevo context con el markdown parseado
      const newContext = {
        id: jobId, // Usar mismo ID del ParsingJob para consistency
        type: "FILE",
        content: result.markdown,
        fileName: completedJob.fileName,
        createdAt: new Date().toISOString(),
        enabled: true,
      };

      await db.chatbot.update({
        where: { id: completedJob.chatbotId },
        data: {
          contexts: [...existingContexts, newContext]
        }
      });

      console.log(`✅ Context added to chatbot ${completedJob.chatbotId}`);

      // 6. Auto-vectorizar el nuevo context
      console.log(`🔄 Auto-vectorizing new context ${jobId}...`);
      const { vectorizeContext } = await import("server/vector/auto-vectorize.service");
      await vectorizeContext(completedJob.chatbotId, newContext);
      console.log(`✅ Context vectorized`);
    }

    console.log(`✅ Job ${jobId} completed successfully`);
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
