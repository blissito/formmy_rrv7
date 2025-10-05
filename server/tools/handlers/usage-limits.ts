/**
 * Usage Limits Handler - Consultar límites y uso del plan
 */

import { db } from "../../../app/utils/db.server";
import type { ToolContext, ToolResponse } from "../index";
import { PLAN_LIMITS } from "../../chatbot/planLimits.server";

interface UsageLimitsInput {
  // No requiere parámetros, usa el userId del contexto
}

export async function getUsageLimitsHandler(
  input: UsageLimitsInput,
  context: ToolContext
): Promise<ToolResponse> {
  try {
    const { userId, userPlan } = context;

    // 🛠️ Mock data para development token
    if (userId === 'dev-user-mock-pro') {
      const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
      const mockConversationsUsed = 47; // Mock usage
      const conversationsLimit = limits.maxConversationsPerMonth;
      const conversationsRemaining =
        conversationsLimit === Infinity
          ? Infinity
          : Math.max(0, conversationsLimit - mockConversationsUsed);

      const creditsLimit = limits.toolCreditsPerMonth;
      const mockCreditsUsed = 312; // Mock usage
      const creditsRemaining =
        creditsLimit === Infinity
          ? Infinity
          : Math.max(0, creditsLimit - mockCreditsUsed);

      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const resetDateStr = resetDate.toISOString().split("T")[0];
      const daysUntilReset = Math.ceil(
        (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const conversationsLimitStr =
        conversationsLimit === Infinity ? "ilimitadas" : conversationsLimit.toString();
      const conversationsRemainingStr =
        conversationsRemaining === Infinity ? "ilimitadas" : conversationsRemaining.toString();
      const creditsLimitStr =
        creditsLimit === Infinity ? "ilimitados" : creditsLimit.toString();
      const creditsRemainingStr =
        creditsRemaining === Infinity ? "ilimitados" : creditsRemaining.toString();

      const percentageUsed =
        conversationsLimit === Infinity
          ? 0
          : Math.round((mockConversationsUsed / conversationsLimit) * 100);

      const response = `**Plan actual: ${userPlan}** (🛠️ Modo desarrollo)

📊 **Uso de Conversaciones:**
- Límite mensual: ${conversationsLimitStr}
- Usadas este mes: ${mockConversationsUsed}
- Restantes: ${conversationsRemainingStr}
- Porcentaje usado: ${percentageUsed}%

💎 **Créditos de Herramientas:**
- Límite mensual: ${creditsLimitStr}
- Usados: ${mockCreditsUsed}
- Restantes: ${creditsRemainingStr}

📅 **Reset del contador:**
Se reinicia el ${resetDateStr} (en ${daysUntilReset} días)

💡 *Datos de ejemplo para testing*`;

      return {
        success: true,
        message: response,
        data: {
          plan: userPlan,
          conversations: {
            limit: conversationsLimit,
            used: mockConversationsUsed,
            remaining: conversationsRemaining,
            percentageUsed,
          },
          credits: {
            limit: creditsLimit,
            used: mockCreditsUsed,
            remaining: creditsRemaining,
          },
          resetDate: resetDateStr,
          daysUntilReset,
        },
      };
    }

    // Obtener usuario con sus stats
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        chatbots: {
          select: {
            monthlyUsage: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: "No se pudo obtener la información del usuario.",
      };
    }

    const plan = (user.plan || "FREE") as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    if (!limits) {
      return {
        success: false,
        message: `Plan "${plan}" no reconocido en el sistema.`,
      };
    }

    // Calcular conversaciones usadas (suma de monthlyUsage de todos los chatbots)
    const conversationsUsed = user.chatbots.reduce(
      (sum, chatbot) => sum + chatbot.monthlyUsage,
      0
    );

    // Calcular conversaciones restantes
    const conversationsLimit = limits.maxConversationsPerMonth;
    const conversationsRemaining =
      conversationsLimit === Infinity
        ? Infinity
        : Math.max(0, conversationsLimit - conversationsUsed);

    // Tool credits (por ahora no tenemos tracking persistente, placeholder)
    const creditsLimit = limits.toolCreditsPerMonth;
    const creditsUsed = 0; // TODO: Implementar tracking de créditos en DB
    const creditsRemaining =
      creditsLimit === Infinity
        ? Infinity
        : Math.max(0, creditsLimit - creditsUsed);

    // Fecha de reset (primer día del próximo mes)
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDateStr = resetDate.toISOString().split("T")[0];

    // Calcular días hasta el reset
    const daysUntilReset = Math.ceil(
      (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Construir respuesta
    const conversationsLimitStr =
      conversationsLimit === Infinity ? "ilimitadas" : conversationsLimit.toString();
    const conversationsRemainingStr =
      conversationsRemaining === Infinity ? "ilimitadas" : conversationsRemaining.toString();

    const creditsLimitStr =
      creditsLimit === Infinity ? "ilimitados" : creditsLimit.toString();
    const creditsRemainingStr =
      creditsRemaining === Infinity ? "ilimitados" : creditsRemaining.toString();

    const percentageUsed =
      conversationsLimit === Infinity
        ? 0
        : Math.round((conversationsUsed / conversationsLimit) * 100);

    let statusMessage = "";
    if (percentageUsed >= 90) {
      statusMessage = "⚠️ **Advertencia**: Has usado más del 90% de tus conversaciones.";
    } else if (percentageUsed >= 75) {
      statusMessage = "📊 Has usado el 75% o más de tus conversaciones disponibles.";
    }

    const response = `**Plan actual: ${plan}**

📊 **Uso de Conversaciones:**
- Límite mensual: ${conversationsLimitStr}
- Usadas este mes: ${conversationsUsed}
- Restantes: ${conversationsRemainingStr}
- Porcentaje usado: ${percentageUsed}%

💎 **Créditos de Herramientas:**
- Límite mensual: ${creditsLimitStr}
- Usados: ${creditsUsed} (tracking próximamente)
- Restantes: ${creditsRemainingStr}

📅 **Reset del contador:**
Se reinicia el ${resetDateStr} (en ${daysUntilReset} días)

${statusMessage}

${
  percentageUsed >= 80 && plan !== "ENTERPRISE"
    ? "\n💡 **Tip**: Considera actualizar tu plan si necesitas más conversaciones."
    : ""
}`;

    return {
      success: true,
      message: response,
      data: {
        plan,
        conversations: {
          limit: conversationsLimit,
          used: conversationsUsed,
          remaining: conversationsRemaining,
          percentageUsed,
        },
        credits: {
          limit: creditsLimit,
          used: creditsUsed,
          remaining: creditsRemaining,
        },
        resetDate: resetDateStr,
        daysUntilReset,
      },
    };
  } catch (error) {
    console.error("Error in getUsageLimitsHandler:", error);
    return {
      success: false,
      message: `Error al obtener límites de uso: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}
