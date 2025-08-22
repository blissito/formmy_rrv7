import type { ToolContext, ToolResponse } from "../registry";
import { createQuickPaymentLink } from "../../integrations/stripe-payments";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";

export async function createPaymentLinkHandler(
  input: {
    amount: number;
    description: string;
    currency?: string;
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { amount, description, currency = "mxn" } = input;
  
  // Verificar integración Stripe
  const stripeApiKey = context.integrations?.stripe?.stripeApiKey;
  if (!stripeApiKey) {
    return {
      success: false,
      message: "⚠️ No se pudo generar el link: Stripe no está configurado correctamente."
    };
  }

  try {
    // Generar el link de pago real
    const paymentUrl = await createQuickPaymentLink(
      stripeApiKey,
      amount,
      description || "Pago",
      currency
    );
    
    // Formatear el monto
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);

    // Track usage (sin awaitar para no bloquear respuesta)
    ToolUsageTracker.trackUsage({
      chatbotId: context.chatbotId,
      toolName: 'create_payment_link',
      success: true,
      userMessage: context.message,
      metadata: {
        amount,
        currency,
        description,
        formattedAmount,
        paymentUrl
      }
    }).catch(console.error);
    
    return {
      success: true,
      message: `🤖 **HERRAMIENTA UTILIZADA: Stripe Payment Link**\n\n✅ **Link de pago generado por ${formattedAmount}:**\n\n🔗 ${paymentUrl}\n\n💳 Puedes proceder con el pago de forma segura usando este link.\n\n🔧 *Sistema: Integración Stripe activada - pago procesado automáticamente*`,
      data: {
        url: paymentUrl,
        amount,
        currency,
        formattedAmount,
        toolUsed: 'create_payment_link'
      }
    };
    
  } catch (error) {
    console.error("Error generando link de pago:", error);
    
    // Track error (sin awaitar)
    ToolUsageTracker.trackUsage({
      chatbotId: context.chatbotId,
      toolName: 'create_payment_link',
      success: false,
      errorMessage: error.message,
      userMessage: context.message,
      metadata: { amount, currency, description }
    }).catch(console.error);
    
    return {
      success: false,
      message: "❌ Error al generar el link de pago. Verifica tu configuración de Stripe."
    };
  }
}