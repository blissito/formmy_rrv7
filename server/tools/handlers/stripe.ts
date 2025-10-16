import type { ToolContext, ToolResponse } from "../types";
import { createQuickPaymentLink } from "../../integrations/stripe-payments";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";
import { createWidget } from "../../widgets/widget-creator.server";

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

    // 🆕 Crear widget en BD
    const widget = await createWidget({
      type: 'payment',
      data: {
        amount: formattedAmount,
        rawAmount: amount,
        currency,
        description,
        paymentUrl
      },
      userId: context.userId,
      chatbotId: context.chatbotId
    });

    console.log(`\n${'💳'.repeat(40)}`);
    console.log(`💳 [Stripe Tool] WIDGET CREADO EN BD`);
    console.log(`   Widget ID: ${widget.id}`);
    console.log(`   Tipo: payment`);
    console.log(`   Amount: ${formattedAmount}`);
    console.log(`   Marcador que se retornará: 🎨WIDGET:payment:${widget.id}🎨`);
    console.log(`${'💳'.repeat(40)}\n`);

    // Track usage (solo si hay chatbotId - Ghosty no tiene chatbot asociado)
    if (context.chatbotId) {
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
          paymentUrl,
          widgetId: widget.id
        }
      }).catch(console.error);
    }

    return {
      success: true,
      message: `🎨WIDGET:payment:${widget.id}🎨

✅ Link de pago generado por ${formattedAmount}

💳 Puedes proceder con el pago de forma segura.`,
      data: {
        widgetId: widget.id,
        widgetType: 'payment',
        url: paymentUrl,
        amount,
        currency,
        formattedAmount,
        toolUsed: 'create_payment_link'
      }
    };
    
  } catch (error) {
    console.error("Error generando link de pago:", error);
    
    // Track error (solo si hay chatbotId)
    if (context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'create_payment_link',
        success: false,
        errorMessage: error.message,
        userMessage: context.message,
        metadata: { amount, currency, description }
      }).catch(console.error);
    }
    
    return {
      success: false,
      message: "❌ Error al generar el link de pago. Verifica tu configuración de Stripe."
    };
  }
}