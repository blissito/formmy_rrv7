/**
 * Parser API v1 - External REST API (estilo LlamaCloud)
 *
 * Endpoints:
 * - POST /api/parser/v1?intent=upload
 * - GET /api/parser/v1?intent=status&jobId=xxx
 */

// ⭐ Cargar .env PRIMERO (desarrollo local)
import "../../server/env.server";

import type { Route } from "./+types/api.parser.v1";
import { extractApiKeyFromRequest, authenticateApiKey } from "../../server/chatbot/apiKeyAuth.server";
import {
  createParsingJob,
  getParsingJobById,
} from "../../server/llamaparse/job.service";
import { uploadParserFile } from "../../server/llamaparse/upload.service";
import type { ParsingMode } from "@prisma/client";
import { enqueueParsingJob } from "../../server/jobs/workers/parser-worker";
import { registerParserWorker } from "../../server/jobs/workers/parser-worker";

/**
 * GET - Check job status
 */
export async function loader({ request }: Route.LoaderArgs) {
  try {
    // Autenticar con API key
    const apiKey = await extractApiKeyFromRequest(request);
    if (!apiKey) {
      return Response.json(
        { error: "API key required. Use Authorization: Bearer sk_live_xxx or X-API-Key header" },
        { status: 401 }
      );
    }

    const authResult = await authenticateApiKey(apiKey);
    const userId = authResult.apiKey.user.id;

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    // GET /api/parser/v1?intent=status&jobId=xxx
    if (intent === "status") {
      const jobId = url.searchParams.get("jobId");

      if (!jobId) {
        return Response.json(
          { error: "jobId parameter required" },
          { status: 400 }
        );
      }

      const job = await getParsingJobById(jobId);

      if (!job) {
        return Response.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }

      // Verificar ownership
      if (job.userId !== userId) {
        return Response.json(
          { error: "Unauthorized - job belongs to different user" },
          { status: 403 }
        );
      }

      // Response estilo LlamaCloud
      return Response.json({
        id: job.id,
        status: job.status, // PENDING, PROCESSING, COMPLETED, FAILED
        fileName: job.fileName,
        mode: job.mode,
        creditsUsed: job.creditsUsed,
        ...(job.status === "COMPLETED" && {
          markdown: job.resultMarkdown,
          pages: job.pages,
          processingTime: job.processingTime,
        }),
        ...(job.status === "FAILED" && {
          error: job.errorMessage,
        }),
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      });
    }

    return Response.json(
      { error: "Invalid intent. Use intent=status" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Parser API] Error in loader:", error);

    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload file for parsing
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    // Autenticar con API key
    const apiKey = await extractApiKeyFromRequest(request);
    if (!apiKey) {
      return Response.json(
        { error: "API key required. Use Authorization: Bearer sk_live_xxx or X-API-Key header" },
        { status: 401 }
      );
    }

    const authResult = await authenticateApiKey(apiKey);
    const userId = authResult.apiKey.user.id;
    const chatbotId = authResult.apiKey.chatbotId; // Asociar al chatbot de la API key

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    // POST /api/parser/v1?intent=upload
    if (intent === "upload") {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const mode = (formData.get("mode") as ParsingMode) || "COST_EFFECTIVE";

      // Validaciones
      if (!file) {
        return Response.json(
          { error: "file field required in multipart/form-data" },
          { status: 400 }
        );
      }

      if (!["DEFAULT", "COST_EFFECTIVE", "AGENTIC", "AGENTIC_PLUS"].includes(mode)) {
        return Response.json(
          { error: "Invalid mode. Use: DEFAULT (free), COST_EFFECTIVE, AGENTIC, or AGENTIC_PLUS" },
          { status: 400 }
        );
      }

      // Validar tamaño (50MB max)
      const MAX_FILE_SIZE_MB = 50;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB` },
          { status: 400 }
        );
      }

      // Leer archivo PRIMERO
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Crear job (esto cuenta páginas, valida y descuenta créditos automáticamente)
      const job = await createParsingJob({
        chatbotId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        mode,
        options: {}, // Usar defaults
        fileBuffer, // ⭐ Pasar buffer para contar páginas
      });

      // Upload archivo a S3
      const { fileKey, publicUrl } = await uploadParserFile(
        fileBuffer,
        file.name,
        job.id,
        file.type || "application/octet-stream"
      );

      // ⭐ Capturar LLAMA_CLOUD_API_KEY para pasar al worker
      const LLAMA_KEY = process.env.LLAMA_CLOUD_API_KEY;

      // Registrar worker (solo se ejecuta una vez gracias al singleton)
      await registerParserWorker();

      // Encolar job en Agenda.js para procesamiento asíncrono
      await enqueueParsingJob({
        jobId: job.id,
        fileUrl: publicUrl,
        fileKey: fileKey,
        llamaApiKey: LLAMA_KEY,
      });

      // Response estilo LlamaCloud
      return Response.json({
        id: job.id,
        status: job.status,
        fileName: job.fileName,
        mode: job.mode,
        creditsUsed: job.creditsUsed,
        createdAt: job.createdAt,
      }, { status: 201 });
    }

    return Response.json(
      { error: "Invalid intent. Use intent=upload" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Parser API] Error in action:", error);

    if (error instanceof Response) {
      return error;
    }

    // Error de créditos insuficientes
    if (error instanceof Error && error.message.includes("Créditos insuficientes")) {
      return Response.json(
        {
          error: "Insufficient credits",
          message: error.message,
        },
        { status: 402 } // Payment Required
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
