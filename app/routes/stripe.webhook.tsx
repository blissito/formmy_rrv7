import { getStripeEvent } from "~/utils/stripe.server";
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "~/lib/stripe/webhook-utils";

type ActionArgs = {
  request: Request;
};

export interface StripeEvent {
  type: string;
  data: {
    object: any; // Usamos any aquí ya que el tipo exacto ya está definido en webhook-utils
  };
}

export const action = async ({ request }: ActionArgs) => {
  // Solo aceptar solicitudes POST
  if (request.method !== "POST") {
    console.warn(
      "[Webhook] Intento de acceso con método no permitido:",
      request.method
    );
    return new Response(null, { status: 405 }); // Method Not Allowed
  }

  try {
    // Verificar y obtener el evento de Stripe
    const event = await getStripeEvent(request);
    if (!event) {
      console.error("[Webhook] No se pudo verificar el evento de Stripe");
      return new Response(null, { status: 400 }); // Bad Request
    }

    console.log(`[Webhook] Evento recibido: ${event.type}`);

    // Manejar el tipo de evento
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`[Webhook] Evento no manejado: ${event.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error al procesar el evento:", error);
    return new Response(null, { status: 500 });
  }
};
