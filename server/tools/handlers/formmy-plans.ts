import type { ToolContext, ToolResponse } from "../types";
import { createQuickPaymentLink } from "../../integrations/stripe-payments";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";
import { createWidget } from "../../widgets/widget-creator.server";

// Definición de planes de Formmy según CLAUDE.md
const FORMMY_PLANS = {
  STARTER: {
    name: 'Plan Starter',
    price: 149,
    priceId: 'price_1S5AqXDtYmGT70YtepLAzwk4',
    chatbots: 1,
    conversations: 50,
    credits: 200
  },
  PRO: {
    name: 'Plan Pro',
    price: 499,
    priceId: 'price_1S5CqADtYmGT70YtTZUtJOiS',
    chatbots: 10,
    conversations: 250,
    credits: 1000
  },
  ENTERPRISE: {
    name: 'Plan Enterprise',
    price: 2490,
    priceId: null, // Custom price_data
    chatbots: Infinity,
    conversations: 2500,
    credits: 5000
  }
} as const;

type PlanKey = keyof typeof FORMMY_PLANS;

export async function createFormmyPlanPaymentHandler(
  input: {
    planName: string;
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { planName } = input;

  // Verificar que Stripe de Formmy esté configurado (patrón consistente con stripe.server.ts)
  const isDevelopment = process.env.NODE_ENV === "development";
  const stripeApiKey = isDevelopment
    ? process.env.TEST_STRIPE_PV
    : process.env.STRIPE_PRIVATE_KEY;

  if (!stripeApiKey) {
    console.error('❌ [create_formmy_plan_payment] Stripe API key no configurada:', {
      isDevelopment,
      TEST_STRIPE_PV: !!process.env.TEST_STRIPE_PV,
      STRIPE_PRIVATE_KEY: !!process.env.STRIPE_PRIVATE_KEY
    });
    return {
      success: false,
      message: "⚠️ Error de configuración: Stripe no está disponible en este momento."
    };
  }

  // Normalizar y validar plan
  const planKey = planName.toUpperCase().replace(/\s+/g, '_') as PlanKey;
  const plan = FORMMY_PLANS[planKey];

  if (!plan) {
    const availablePlans = Object.keys(FORMMY_PLANS).join(', ');
    return {
      success: false,
      message: `❌ Plan "${planName}" no encontrado. Planes disponibles: ${availablePlans}`
    };
  }

  try {
    // Generar el link de pago con Stripe de Formmy
    const paymentUrl = await createQuickPaymentLink(
      stripeApiKey,
      plan.price,
      plan.name,
      "mxn"
    );

    // Formatear el monto
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(plan.price);

    // Crear widget en BD
    const widget = await createWidget({
      type: 'payment',
      data: {
        amount: formattedAmount,
        rawAmount: plan.price,
        currency: 'mxn',
        description: plan.name,
        paymentUrl,
        planKey,
        priceId: plan.priceId
      },
      userId: context.userId,
      chatbotId: context.chatbotId
    });

    // Track usage (solo si hay chatbotId)
    if (context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'create_formmy_plan_payment',
        success: true,
        userMessage: context.message,
        metadata: {
          planKey,
          planName: plan.name,
          amount: plan.price,
          formattedAmount,
          paymentUrl,
          widgetId: widget.id
        }
      }).catch(console.error);
    }

    return {
      success: true,
      message: `🎨WIDGET:payment:${widget.id}🎨

✅ **Link de pago generado para ${plan.name}**

💰 **Precio:** ${formattedAmount}/mes
📊 **Incluye:**
• ${plan.chatbots === Infinity ? 'Chatbots ilimitados' : `${plan.chatbots} chatbots`}
• ${plan.conversations} conversaciones/mes
• ${plan.credits} créditos para herramientas

💳 Puedes proceder con el pago de forma segura.`,
      data: {
        widgetId: widget.id,
        widgetType: 'payment',
        url: paymentUrl,
        amount: plan.price,
        currency: 'mxn',
        formattedAmount,
        planKey,
        toolUsed: 'create_formmy_plan_payment'
      }
    };

  } catch (error) {
    console.error("Error generando link de pago de plan:", error);

    // Track error (solo si hay chatbotId)
    if (context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'create_formmy_plan_payment',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userMessage: context.message,
        metadata: { planName, planKey }
      }).catch(console.error);
    }

    return {
      success: false,
      message: "❌ Error al generar el link de pago. Por favor intenta de nuevo."
    };
  }
}
