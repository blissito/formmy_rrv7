import { ToolContext, ToolResponse } from "../registry";
import { createQuickPaymentLink } from "../../integrations/stripe-payments";

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
    
    return {
      success: true,
      message: `✅ Link de pago generado por ${formattedAmount}:\n${paymentUrl}\n\n💳 Puedes proceder con el pago de forma segura usando este link.`,
      data: {
        url: paymentUrl,
        amount,
        currency,
        formattedAmount
      }
    };
    
  } catch (error) {
    console.error("Error generando link de pago:", error);
    return {
      success: false,
      message: "❌ Error al generar el link de pago. Verifica tu configuración de Stripe."
    };
  }
}