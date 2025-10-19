import type { Route } from "./+types/api.v1.llamaparse";
import { getUserOrRedirect } from "../../server/getUserUtils.server";
import {
  createParsingJob,
  getUserParsingJobs,
  getParsingJobById,
} from "../../server/llamaparse/job.service";
import { uploadParserFile } from "../../server/llamaparse/upload.service";
import { addMarkdownToContext } from "../../server/llamaparse/embedding.service";
import { enqueueParsingJob } from "../../server/jobs/workers/parser-worker";
import { registerParserWorker } from "../../server/jobs/workers/parser-worker";
import type { ParsingMode } from "@prisma/client";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  // GET /api/v1/llamaparse?intent=get_jobs
  if (intent === "get_jobs") {
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const jobs = await getUserParsingJobs(user.id, limit);

    return Response.json({ success: true, jobs });
  }

  // GET /api/v1/llamaparse?intent=get_job&jobId=xxx
  if (intent === "get_job") {
    const jobId = url.searchParams.get("jobId");
    if (!jobId) {
      return Response.json(
        { success: false, error: "jobId requerido" },
        { status: 400 }
      );
    }

    const job = await getParsingJobById(jobId);

    if (!job) {
      return Response.json(
        { success: false, error: "Job no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el job pertenece al usuario
    if (job.userId !== user.id) {
      return Response.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    return Response.json({ success: true, job });
  }

  return Response.json(
    { success: false, error: "Intent no soportado" },
    { status: 400 }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    switch (intent) {
      case "estimate_cost": {
        const mode = formData.get("mode") as ParsingMode;
        const file = formData.get("file") as File | null;

        if (!mode || !file) {
          return Response.json(
            { success: false, error: "Modo y archivo requeridos" },
            { status: 400 }
          );
        }

        // Leer archivo como buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Importar utilidades
        const { countPDFPages, calculateCreditsForPages } = await import(
          "server/llamaparse/pdf-utils.server"
        );
        const { PLAN_LIMITS } = await import("server/chatbot/planLimits.server");

        // Contar páginas usando la misma lógica que el procesamiento real
        const pageCount = file.name.toLowerCase().endsWith('.pdf')
          ? await countPDFPages(fileBuffer)
          : 5; // Para no-PDFs, usar estimación estándar

        // Calcular créditos
        const creditsRequired = calculateCreditsForPages(mode, pageCount);

        // Calcular créditos disponibles del usuario
        const planLimit = PLAN_LIMITS[user.plan].toolCreditsPerMonth;
        const monthlyUsed = user.toolCreditsUsed || 0;
        const purchasedCredits = user.purchasedCredits || 0;
        const totalAvailable = (planLimit - monthlyUsed) + purchasedCredits;

        return Response.json({
          success: true,
          pages: pageCount,
          creditsRequired,
          totalAvailable,
          hasEnoughCredits: totalAvailable >= creditsRequired,
          breakdown: {
            monthlyAvailable: planLimit - monthlyUsed,
            purchasedAvailable: purchasedCredits,
          }
        });
      }

      case "create_job": {
        const chatbotId = formData.get("chatbotId") as string;
        const fileName = formData.get("fileName") as string;
        const fileSize = parseInt(formData.get("fileSize") as string);
        const fileType = formData.get("fileType") as string;
        const mode = formData.get("mode") as ParsingMode;
        const optionsStr = formData.get("options") as string;
        const file = formData.get("file") as File | null;
        const options = JSON.parse(optionsStr);

        // Validaciones básicas
        if (!chatbotId || !fileName || !fileSize || !fileType || !mode || !file) {
          return Response.json(
            { success: false, error: "Faltan parámetros requeridos" },
            { status: 400 }
          );
        }

        // Validar modo
        if (!["COST_EFFECTIVE", "AGENTIC", "AGENTIC_PLUS"].includes(mode)) {
          return Response.json(
            { success: false, error: "Modo de parsing inválido" },
            { status: 400 }
          );
        }

        // Validar tamaño (50MB max)
        const MAX_FILE_SIZE_MB = 50;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE_BYTES) {
          return Response.json(
            { success: false, error: `Archivo demasiado grande. Máximo ${MAX_FILE_SIZE_MB}MB` },
            { status: 400 }
          );
        }

        // Leer archivo PRIMERO (para contar páginas)
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Crear job (esto cuenta páginas y cobra créditos correctamente)
        const job = await createParsingJob({
          chatbotId,
          userId: user.id,
          fileName,
          fileSize,
          fileType,
          mode,
          options,
          fileBuffer, // ⭐ Pasar buffer para contar páginas
        });

        // Upload archivo a S3
        const { fileKey, publicUrl } = await uploadParserFile(
          fileBuffer,
          fileName,
          job.id,
          fileType
        );

        // ⭐ Capturar LLAMA_CLOUD_API_KEY para pasar al worker
        const LLAMA_KEY = process.env.LLAMA_CLOUD_API_KEY;

        // Registrar worker (solo se ejecuta una vez gracias al singleton)
        await registerParserWorker();

        // Encolar job en Agenda.js para procesamiento asíncrono (PRODUCCIÓN-READY)
        await enqueueParsingJob({
          jobId: job.id,
          fileUrl: publicUrl,
          fileKey: fileKey,
          llamaApiKey: LLAMA_KEY,
        });

        return Response.json({
          success: true,
          jobId: job.id,
          message: "Job creado exitosamente",
        });
      }

      case "get_job": {
        const jobId = formData.get("jobId") as string;

        if (!jobId) {
          return Response.json(
            { success: false, error: "jobId requerido" },
            { status: 400 }
          );
        }

        const job = await getParsingJobById(jobId);

        if (!job) {
          return Response.json(
            { success: false, error: "Job no encontrado" },
            { status: 404 }
          );
        }

        // Verificar que el job pertenece al usuario
        if (job.userId !== user.id) {
          return Response.json(
            { success: false, error: "No autorizado" },
            { status: 403 }
          );
        }

        return Response.json({ success: true, job });
      }

      case "get_jobs": {
        const limit = parseInt((formData.get("limit") as string) || "10");
        const jobs = await getUserParsingJobs(user.id, limit);

        return Response.json({ success: true, jobs });
      }

      case "add_to_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const markdown = formData.get("markdown") as string;
        const fileName = formData.get("fileName") as string;

        if (!chatbotId || !markdown || !fileName) {
          return Response.json(
            { success: false, error: "Faltan parámetros requeridos" },
            { status: 400 }
          );
        }

        // TODO: Verificar que el chatbot pertenece al usuario

        const result = await addMarkdownToContext(chatbotId, markdown, fileName);

        if (!result.success) {
          return Response.json(
            { success: false, error: result.error || "Error agregando al contexto" },
            { status: 500 }
          );
        }

        return Response.json({
          success: true,
          embeddingsCreated: result.embeddingsCreated,
          message: `${result.embeddingsCreated} fragmentos agregados al contexto`,
        });
      }

      default:
        return Response.json(
          { success: false, error: "Intent no soportado" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en /api/v1/llamaparse:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error del servidor",
      },
      { status: 500 }
    );
  }
}
