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

// @TODO: check for duplications
export const getOrCreateCustomerId = async (user: User): Promise<string> => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const stripe = new Stripe(
    (isDevelopment
      ? process.env.TEST_STRIPE_PV
      : process.env.STRIPE_PRIVATE_KEY) ?? ""
  );
  if (user.customerId) {
    const exists = await stripe.customers.retrieve(user.customerId); // @TODO: this could fail
    if (exists.id) return exists.id;
    // if (exists.deleted) throw new Error("No such customer");
  }
  const customer = await stripe.customers.create({
    name: user.name ?? "",
    email: user.email,
  });
  if (!customer) throw new Error("No se pudo crear el customer");
  await db.user.update({
    where: { id: user.id },
    data: { customerId: customer.id },
  });
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
      return createCheckoutSessionURL({ user, origin });
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
}) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const DOMAIN = origin;
  const stripe = getClient();

  const ANUAL_PRICE = isDevelopment
    ? "price_1OinGRDtYmGT70YtS3fKsenE"
    : "price_1OgF7RDtYmGT70YtcGL3AxDQ"; // prod

  const MONTHLY_PLAN = isDevelopment
    ? "price_1OinFxDtYmGT70YtW9UbUdpM"
    : "price_1OgF7RDtYmGT70YtJB3kRl9T"; // prod

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

  return session.url;
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
  const url = await createCheckoutSessionURL({
    user,
    price,
    origin: new URL(request.url).origin,
  });
  return url;
};

let stripeClient;
export const getClient = () => {
  const isDev = process.env.NODE_ENV === "development";
  stripeClient ??= new Stripe(
    (isDev ? process.env.TEST_STRIPE_PV : process.env.STRIPE_PRIVATE_KEY) ?? ""
  );
  return stripeClient;
};
