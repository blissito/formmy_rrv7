import { db } from "~/utils/db.server";
import type { ParsingMode, ParsingStatus } from "@prisma/client";

interface CreateParsingJobParams {
  chatbotId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mode: ParsingMode;
  options: any;
}

interface MockParsingResult {
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
 * MOCK: Simular procesamiento de documento
 * Mañana esto se reemplazará con LlamaParse real
 */
async function mockParsing(
  fileName: string,
  mode: ParsingMode
): Promise<MockParsingResult> {
  // Simular procesamiento con delay variable por modo
  const delays = {
    COST_EFFECTIVE: 1500,
    AGENTIC: 2500,
    AGENTIC_PLUS: 3500,
  };

  await new Promise((resolve) => setTimeout(resolve, delays[mode]));

  const modeLabels = {
    COST_EFFECTIVE: "Cost Effective",
    AGENTIC: "Agentic",
    AGENTIC_PLUS: "Agentic Plus",
  };

  return {
    markdown: `# Resultado de Extracción Avanzada

## Documento: ${fileName}
**Modo:** ${modeLabels[mode]}

---

### Resumen

Este documento ha sido procesado exitosamente con nuestro motor de procesamiento inteligente.

### Contenido Extraído

- ✅ Texto estructurado detectado
- ✅ Tablas y datos tabulares identificados
- ✅ Imágenes y diagramas procesados
- ✅ Formato preservado correctamente

### Tabla de Ejemplo

| Métrica | Valor |
|---------|-------|
| Páginas procesadas | 5 |
| Precisión | Alta |
| Tiempo | Óptimo |

### Conclusión

El procesamiento se completó exitosamente. El contenido está listo para ser agregado al contexto de tu chatbot.

---

*Procesado con Formmy Extracción Avanzada - Modo: ${modeLabels[mode]}*`,
    pages: Math.floor(Math.random() * 10) + 1,
    processingTime: delays[mode] / 1000,
  };
}

/**
 * Procesar un job de parsing
 * Esta función será llamada por el worker/background processor
 */
export async function processParsingJob(jobId: string) {
  try {
    // 1. Actualizar estado a PROCESSING
    const job = await db.parsingJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    // 2. Procesar documento (MOCK por ahora)
    const result = await mockParsing(job.fileName, job.mode);

    // 3. Actualizar con resultado exitoso
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
    // 4. Manejar error
    console.error(`❌ Job ${jobId} failed:`, error);

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
