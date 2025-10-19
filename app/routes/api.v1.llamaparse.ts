import type { Route } from "./+types/api.v1.llamaparse";
import { getUserOrRedirect } from "server/getUserUtils.server";
import {
  createParsingJob,
  getUserParsingJobs,
  getParsingJobById,
  processParsingJob,
} from "server/llamaparse/job.service";
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
      case "create_job": {
        const chatbotId = formData.get("chatbotId") as string;
        const fileName = formData.get("fileName") as string;
        const fileSize = parseInt(formData.get("fileSize") as string);
        const fileType = formData.get("fileType") as string;
        const mode = formData.get("mode") as ParsingMode;
        const optionsStr = formData.get("options") as string;
        const options = JSON.parse(optionsStr);

        // Validaciones básicas
        if (!chatbotId || !fileName || !fileSize || !fileType || !mode) {
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

        // Crear job
        const job = await createParsingJob({
          chatbotId,
          userId: user.id,
          fileName,
          fileSize,
          fileType,
          mode,
          options,
        });

        // Procesar en background (setTimeout simula queue/worker)
        // En producción esto sería un queue real (Bull, BullMQ, etc.)
        setTimeout(() => {
          processParsingJob(job.id).catch((error) => {
            console.error(`Error procesando job ${job.id}:`, error);
          });
        }, 100);

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
