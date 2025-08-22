import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserOrRedirect } from "~/utils/auth.server";
import { getCostMetrics, getUserCostMetrics } from "../../server/chatbot/cost-analytics.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUserOrRedirect(request);
  
  try {
    const formData = await request.formData();
    const chatbotId = formData.get("chatbotId")?.toString();
    const startDate = formData.get("startDate")?.toString();
    const endDate = formData.get("endDate")?.toString();
    const scope = formData.get("scope")?.toString() || "user"; // "user" | "chatbot"

    // Validar fechas si se proporcionan
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return json({ error: "Invalid start date format" }, { status: 400 });
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return json({ error: "Invalid end date format" }, { status: 400 });
      }
    }

    // Si no se especifican fechas, usar los últimos 30 días
    if (!parsedStartDate && !parsedEndDate) {
      parsedEndDate = new Date();
      parsedStartDate = new Date();
      parsedStartDate.setDate(parsedStartDate.getDate() - 30);
    }

    let metrics;

    if (scope === "chatbot" && chatbotId) {
      // Métricas para un chatbot específico
      metrics = await getCostMetrics(chatbotId, parsedStartDate, parsedEndDate);
    } else {
      // Métricas para todos los chatbots del usuario
      metrics = await getUserCostMetrics(user.id, parsedStartDate, parsedEndDate);
    }

    return json({
      success: true,
      data: metrics,
      period: {
        startDate: parsedStartDate?.toISOString(),
        endDate: parsedEndDate?.toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching cost metrics:", error);
    return json({ 
      error: "Failed to fetch cost metrics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function loader() {
  // GET no soportado, solo POST/PATCH
  return json({ error: "Method not allowed" }, { status: 405 });
}