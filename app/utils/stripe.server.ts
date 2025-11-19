import {
  getUserOrRedirect,
  getUserOrTriggerLogin,
} from "server/getUserUtils.server";
import { type User } from "@prisma/client";
import Stripe from "stripe";
import type { StripeEvent } from "~/routes/stripe.webhook";
import { db } from "~/utils/db.server";

// Función de utilidad para crear respuestas de error
function createErrorResponse(error: Error, status = 400): Response {
  return new Response(JSON.stringify({ error: error.message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const isDevelopment = process.env.NODE_ENV === "development";

const ANUAL_PRICE = isDevelopment
  ? "price_1OinGRDtYmGT70YtS3fKsenE"
  : "price_1OgF7RDtYmGT70YtcGL3AxDQ"; // prod

const MONTHLY_PLAN = isDevelopment
  ? "price_1OinFxDtYmGT70YtW9UbUdpM"
  : "price_1OgF7RDtYmGT70YtJB3kRl9T"; // prod

const DOMAIN =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://formmy.app";

export const searchStripeSubscriptions = async (user: User) => {
  const stripe = new Stripe(
    (isDevelopment
      ? process.env.TEST_STRIPE_PV
      : process.env.STRIPE_PRIVATE_KEY) ?? ""
  );
  if (!user.subscriptionIds[0]) return null;
  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.subscriptionIds[0]
    );
    return subscription;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Busca si el usuario tiene alguna suscripción activa en Stripe
 * @returns La primera suscripción activa encontrada, o null si no tiene ninguna
 */
export const getActiveSubscription = async (user: User): Promise<Stripe.Subscription | null> => {
  if (!user.customerId) return null;

  const stripe = getClient();

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) return null;

    // Log warning si hay múltiples suscripciones activas
    if (subscriptions.data.length > 1) {
      console.warn(`[Stripe] ⚠️ Usuario ${user.email} tiene ${subscriptions.data.length} suscripciones activas`);
    }

    // Retornar la primera suscripción activa
    return subscriptions.data[0];
  } catch (error) {
    console.error(`[Stripe] Error buscando suscripciones activas para ${user.email}:`, error);
    return null;
  }
};

// @TODO: check for duplications
export const getOrCreateCustomerId = async (user: User): Promise<string> => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const stripe = new Stripe(
    (isDevelopment
      ? process.env.TEST_STRIPE_PV
      : process.env.STRIPE_PRIVATE_KEY) ?? ""
  );

  // If user has a valid customerId (not temp_migration_*), verify it exists in Stripe
  if (user.customerId && !user.customerId.startsWith('temp_migration_')) {
    try {
      const exists = await stripe.customers.retrieve(user.customerId);
      if (exists.id && !exists.deleted) return exists.id;

      // Customer is deleted in Stripe, fall through to search by email
      console.log(`[Stripe] Customer ${user.customerId} is deleted for user ${user.email}`);
    } catch (error: any) {
      // Customer doesn't exist in Stripe, fall through to search by email
      console.log(`[Stripe] Customer ${user.customerId} not found for user ${user.email}`);
    }
  }

  // Search for existing customer by email (handles temp_migration_* and invalid IDs)
  try {
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      console.log(`[Stripe] Found existing customer ${customer.id} for email ${user.email}`);

      // Update user with real customerId
      await db.user.update({
        where: { id: user.id },
        data: { customerId: customer.id },
      });

      return customer.id;
    }
  } catch (error: any) {
    console.log(`[Stripe] Error searching customer by email: ${error.message}`);
  }

  // Create new customer in Stripe
  const customer = await stripe.customers.create({
    name: user.name ?? "",
    email: user.email,
  });

  if (!customer) throw new Error("No se pudo crear el customer");

  // Update user with new valid customerId
  await db.user.update({
    where: { id: user.id },
    data: { customerId: customer.id },
  });

  console.log(`[Stripe] Created new customer ${customer.id} for user ${user.email}`);
  return customer.id;
};

export const createBillingSessionURL = async (user: User) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const stripe = new Stripe(
    (isDevelopment
      ? process.env.TEST_STRIPE_PV
      : process.env.STRIPE_PRIVATE_KEY) ?? ""
  );
  const customer = await getOrCreateCustomerId(user);
  const session = await stripe.billingPortal.sessions.create({
    customer,
  });
  return session.url;
};

export const createBillingSessionOrCheckoutURL = async (
  user: User,
  origin: string
): Promise<string | undefined> => {
  try {
    if (user.customerId && user.plan === "PRO") {
      return createBillingSessionURL(user);
    } else {
      const result = await createCheckoutSessionURL({ user, origin });
      return result.type === 'checkout' ? result.url : undefined;
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
};

export const getStripeEvent = async (
  request: Request
): Promise<StripeEvent | undefined> => {
  // En desarrollo, devolvemos un evento simulado sin verificar la firma
  if (process.env.NODE_ENV === "development") {
    try {
      const payload = await request.text();
      return JSON.parse(payload) as StripeEvent;
    } catch (error) {
      console.error('Error al parsear el payload en modo desarrollo:', error);
      throw new Error('Error al parsear el payload del webhook');
    }
  }

  // En producción, verificamos la firma del webhook
  const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || '');
  const payload = await request.text();
  const webhookSecret = process.env.STRIPE_SIGNING_SECRET || '';
  const webhookStripeSignatureHeader = request.headers.get("stripe-signature") || "";
  
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      webhookStripeSignatureHeader,
      webhookSecret
    );
    return event;
  } catch (error) {
    console.error(`Stripe construct event error: ${error}`);
    if (error instanceof Error) {
      throw createErrorResponse(error);
    }
    throw new Error('Error desconocido al verificar el evento de Stripe');
  }
};

export const createCheckoutSessionURL = async ({
  user,
  origin,
  coupon,
  price, // anual by default
  priceData, // custom price data (para precios custom sin crear price ID)
  mode = "subscription", // subscription (recurring) o payment (one-time)
  metadata, // metadata adicional para el checkout session
  successUrl, // URL de éxito personalizada
  cancelUrl, // URL de cancelación personalizada
}: {
  origin: string;
  coupon?: string;
  user: User | null;
  price?: string;
  priceData?: {
    currency: string;
    unit_amount: number;
    recurring?: { interval: 'month' | 'year' }; // Opcional para payment mode
    product_data: { name: string; description?: string };
  };
  mode?: "subscription" | "payment";
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<
  | { type: 'checkout'; url: string }
  | { type: 'upgraded'; subscription: Stripe.Subscription }
  | { type: 'same_plan'; currentPlan: string }
> => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const DOMAIN = origin;
  const stripe = getClient();

  const ANUAL_PRICE = isDevelopment
    ? "price_1OinGRDtYmGT70YtS3fKsenE"
    : "price_1OgF7RDtYmGT70YtcGL3AxDQ"; // prod

  const MONTHLY_PLAN = isDevelopment
    ? "price_1OinFxDtYmGT70YtW9UbUdpM"
    : "price_1OgF7RDtYmGT70YtJB3kRl9T"; // prod

  // ✅ UPGRADE/DOWNGRADE AUTOMÁTICO: Verificar si usuario ya tiene suscripción activa
  if (user && mode === "subscription") {
    const activeSubscription = await getActiveSubscription(user);

    if (activeSubscription) {
      console.log(`[Stripe] Usuario ${user.email} tiene suscripción activa ${activeSubscription.id}`);

      const currentPriceId = activeSubscription.items.data[0].price.id;
      const newPriceId = price || ANUAL_PRICE;

      // ✅ VALIDACIÓN: Verificar si ya tiene este mismo plan
      if (currentPriceId === newPriceId) {
        console.log(`[Stripe] Usuario ${user.email} ya tiene el precio ${newPriceId}. No se requiere actualización.`);
        return {
          type: 'same_plan' as const,
          currentPlan: metadata?.plan || 'UNKNOWN',
        };
      }

      // Usuario tiene un plan diferente → Hacer upgrade/downgrade
      console.log(`[Stripe] Cambiando de ${currentPriceId} a ${newPriceId}...`);

      try {
        // Actualizar la suscripción existente con el nuevo precio
        const updatedSubscription = await stripe.subscriptions.update(
          activeSubscription.id,
          {
            items: [{
              id: activeSubscription.items.data[0].id,
              price: newPriceId,
            }],
            proration_behavior: 'always_invoice', // Facturar proration inmediatamente
            metadata: metadata || activeSubscription.metadata,
          }
        );

        console.log(`[Stripe] ✅ Suscripción ${activeSubscription.id} actualizada a precio ${newPriceId}`);

        // Actualizar plan del usuario en DB basado en metadata
        if (metadata?.plan) {
          await db.user.update({
            where: { id: user.id },
            data: { plan: metadata.plan as any },
          });
        }

        return { type: 'upgraded', subscription: updatedSubscription };
      } catch (error) {
        console.error(`[Stripe] Error actualizando suscripción ${activeSubscription.id}:`, error);
        throw new Error('No se pudo actualizar tu suscripción. Por favor contacta soporte.');
      }
    }
  }

  // ✅ FLUJO NORMAL: Usuario NO tiene suscripción activa → Crear checkout
  const lineItem: any = priceData
    ? { price_data: priceData, quantity: 1 }
    : { price: price || ANUAL_PRICE, quantity: 1 };

  const defaultSuccessUrl = mode === "payment"
    ? `${DOMAIN}/dashboard/plan?credits_purchased=1`
    : `${DOMAIN}/dashboard/plan?success=1`;
  const defaultCancelUrl = `${DOMAIN}/planes`;

  const sessionConfig: any = {
    mode,
    success_url: successUrl || defaultSuccessUrl,
    cancel_url: cancelUrl || defaultCancelUrl,
    line_items: [lineItem],
    allow_promotion_codes: true, // Habilita campo nativo de cupones en checkout
  };

  if (metadata) {
    sessionConfig.metadata = metadata;
    // Para subscriptions, también agregar metadata a la suscripción
    if (mode === "subscription") {
      sessionConfig.subscription_data = {
        metadata: metadata
      };
    }
  }

  if (user) {
    sessionConfig.customer = await getOrCreateCustomerId(user);
  } else if (mode === "payment") {
    // Para payment mode sin usuario, permitir que Stripe cree customer
    sessionConfig.customer_creation = "always";
  }
  // Para usuarios anónimos en modo subscription, Stripe crea customer automáticamente
  // No necesitamos customer_creation ya que solo funciona en payment mode

  if (coupon) {
    sessionConfig.discounts = { coupon };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return { type: 'checkout', url: session.url! };
};

export const getStripeURL = async (
  request: Request,
  type: "month" | "year" = "year"
) => {
  let price;
  if (type === "month") {
    price = MONTHLY_PLAN;
  }

  const user = await getUserOrTriggerLogin(request); // @todo revisit
  const result = await createCheckoutSessionURL({
    user,
    price,
    origin: new URL(request.url).origin,
  });
  return result.type === 'checkout' ? result.url : undefined;
};

let stripeClient;
export const getClient = () => {
  const isDev = process.env.NODE_ENV === "development";
  stripeClient ??= new Stripe(
    (isDev ? process.env.TEST_STRIPE_PV : process.env.STRIPE_PRIVATE_KEY) ?? ""
  );
  return stripeClient;
};
