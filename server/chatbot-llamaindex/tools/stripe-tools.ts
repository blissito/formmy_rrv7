/**
 * STRIPE TOOLS - LLAMAINDEX PATTERNS
 */

import { FunctionTool } from "llamaindex";

export interface StripeToolContext {
  chatbotId: string;
  userId: string;
  stripeConfig: any;
}

/**
 * CREATE PAYMENT LINK TOOL
 */
export async function createPaymentLinkTool(context: StripeToolContext): Promise<FunctionTool> {
  return FunctionTool.from({
    name: "create_payment_link",
    description: "Crear un link de pago de Stripe para cobrar al cliente",
    fn: async ({
      amount,
      description,
      currency = "mxn",
    }: {
      amount: number;
      description: string;
      currency?: "mxn" | "usd";
    }) => {

      try {
        // Importar handler de stripe existente
        const { createPaymentLinkHandler } = await import("../../tools/handlers/stripe");

        const result = await createPaymentLinkHandler(
          { amount, description, currency },
          {
            chatbotId: context.chatbotId,
            userId: context.userId,
            message: `Crear link de pago: ${description} - $${amount} ${currency.toUpperCase()}`,
          }
        );

        if (result.success) {
          return result.message;
        } else {
          return `❌ ${result.message}`;
        }

      } catch (error) {
        console.error("❌ Error en create_payment_link:", error);
        return `❌ Error al crear el link de pago: ${error.message}`;
      }
    },
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Cantidad a cobrar en números (ej: 500, 1000)",
        },
        description: {
          type: "string",
          description: "Descripción del pago o servicio",
        },
        currency: {
          type: "string",
          enum: ["mxn", "usd"],
          description: "Moneda del pago (default: 'mxn' para pesos mexicanos)",
        },
      },
      required: ["amount", "description"],
    },
  });
}

/**
 * FACTORY FUNCTION - Create all Stripe tools
 */
export async function createStripeTools(context: StripeToolContext): Promise<FunctionTool[]> {
  const tools: FunctionTool[] = [];

  try {
    // Create payment link tool
    const paymentLink = await createPaymentLinkTool(context);
    tools.push(paymentLink);

    return tools;

  } catch (error) {
    console.error("❌ Error creating Stripe tools:", error);
    return [];
  }
}