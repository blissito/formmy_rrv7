import { db } from "~/utils/db.server";
import type { ParsingMode, ParsingStatus } from "@prisma/client";
import { LlamaParseReader } from "llama-cloud-services";
import { deleteParserFile } from "./upload.service";

interface CreateParsingJobParams {
  chatbotId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mode: ParsingMode;
  options: any;
}

interface ParsingResult {
  markdown: string;
  pages: number;
  processingTime: number;
}

// Mapeo de créditos por modo
function getModeCredits(mode: ParsingMode): number {
  const creditsMap: Record<ParsingMode, number> = {
    COST_EFFECTIVE: 1,
    AGENTIC: 3,
    AGENTIC_PLUS: 6,
  };
  return creditsMap[mode];
}

/**
 * Crear un nuevo job de parsing
 */
export async function createParsingJob(params: CreateParsingJobParams) {
  const credits = getModeCredits(params.mode);

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
    },
  });

  return job;
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
  options: any
): Promise<ParsingResult> {
  const startTime = Date.now();

  try {
    // Inicializar LlamaParse reader
    const reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY!,
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
  fileKey: string
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
      job.options
    );

    // 3. Eliminar archivo temporal de S3
    await deleteParserFile(fileKey);

    // 4. Actualizar con resultado exitoso
    await db.parsingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        resultMarkdown: result.markdown,
        pages: result.pages,
        processingTime: result.processingTime,
        completedAt: new Date(),
      },
    });

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
