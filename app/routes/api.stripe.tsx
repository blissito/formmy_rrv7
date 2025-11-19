import { createCheckoutSessionURL, createBillingSessionURL } from "~/utils/stripe.server";
import type { Route } from "./+types/api.stripe";
import { getUserOrTriggerLogin } from "server/getUserUtils.server";

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const isDevelopment = process.env.NODE_ENV === "development";

  // Obtener el usuario logueado para los planes de suscripción
  const user = await getUserOrTriggerLogin(request);

  // Handle billing portal intent
  if (intent === "manage-stripe") {
    const billingUrl = await createBillingSessionURL(user);
    return Response.redirect(billingUrl);
  }

  // Price IDs según entorno
  const PRICES = {
    starter: isDevelopment
      ? process.env.STRIPE_STARTER_PRICE_TEST || "price_test_starter"
      : "price_1S5AqXDtYmGT70YtepLAzwk4",
    pro: isDevelopment
      ? process.env.STRIPE_PRO_PRICE_TEST || "price_test_pro"
      : "price_1S5CqADtYmGT70YtTZUtJOiS",
    enterprise: isDevelopment
      ? process.env.STRIPE_ENTERPRISE_PRICE_TEST || "price_test_enterprise"
      : "price_1SSPzKDtYmGT70YtIgLWY8d5",
    // Credits one-time purchases - Price IDs reales de producción
    credits_100: "price_1SLwONRuGQeGCFrvx7YKBzMT", // TODO: Necesita price ID correcto
    credits_500: "price_1SLwONRuGQeGCFrvx7YKBzMT", // $99 MXN
    credits_2000: "price_1SLwPBRuGQeGCFrvwVfKj8Lk", // $349 MXN
    credits_5000: "price_1SLwPqRuGQeGCFrvQZeRStNm", // $799 MXN
  };

  // New plan intents
  if (intent === "starter_plan") {
    const result = await createCheckoutSessionURL({
      user,
      price: PRICES.starter,
      origin: new URL(request.url).origin,
      metadata: { plan: "STARTER" },
    });

    if (result.type === 'checkout') {
      return Response.redirect(result.url);
    } else if (result.type === 'upgraded') {
      // Upgrade directo - redirigir a dashboard con mensaje de éxito
      return Response.redirect(`${new URL(request.url).origin}/dashboard/plan?upgraded=1&plan=STARTER`);
    } else {
      // same_plan - ya tiene este plan
      return Response.redirect(`${new URL(request.url).origin}/dashboard/plan?info=same_plan&plan=${result.currentPlan}`);
    }
  }

  if (intent === "pro_plan") {
    const result = await createCheckoutSessionURL({
      user,
      price: PRICES.pro,
      origin: new URL(request.url).origin,
      metadata: { plan: "PRO" },
    });

    if (result.type === 'checkout') {
      return Response.redirect(result.url);
    } else if (result.type === 'upgraded') {
      // Upgrade directo - redirigir a dashboard con mensaje de éxito
      return Response.redirect(`${new URL(request.url).origin}/dashboard/plan?upgraded=1&plan=PRO`);
    } else {
      // same_plan - ya tiene este plan
      return Response.redirect(`${new URL(request.url).origin}/dashboard/plan?info=same_plan&plan=${result.currentPlan}`);
    }
  }

  if (intent === "enterprise_plan") {
    const result = await createCheckoutSessionURL({
      user,
      price: PRICES.enterprise,
      origin: new URL(request.url).origin,
      metadata: { plan: "ENTERPRISE" },
    });

    if (result.type === 'checkout') {
      return Response.redirect(result.url);
    } else if (result.type === 'upgraded') {
      // Upgrade directo - redirigir a dashboard con mensaje de éxito
      return Response.redirect(`${new URL(request.url).origin}/dashboard/plan?upgraded=1&plan=ENTERPRISE`);
    } else {
      // same_plan - ya tiene este plan
      return Response.redirect(`${new URL(request.url).origin}/dashboard/plan?info=same_plan&plan=${result.currentPlan}`);
    }
  }

  // Conversations purchase intents (one-time payments)
  const origin = new URL(request.url).origin;

  // Helper para calcular precio según plan
  const getConversationPrice = (amount: number, plan: string): number => {
    let pricePerConv = 1.98; // Default/FREE

    switch (plan) {
      case "STARTER":
      case "TRIAL":
        pricePerConv = 1.49;
        break;
      case "PRO":
        pricePerConv = 0.99;
        break;
      case "ENTERPRISE":
        pricePerConv = 0.69;
        break;
    }

    return Math.round(amount * pricePerConv * 100); // Convertir a centavos
  };

  if (intent === "conversations_50") {
    const plan = formData.get("plan") as string || "FREE";
    const unitAmount = getConversationPrice(50, plan);

    const result = await createCheckoutSessionURL({
      user: null,
      priceData: {
        currency: 'mxn',
        unit_amount: unitAmount,
        product_data: {
          name: '50 Conversaciones',
          description: `50 conversaciones adicionales para tus chatbots (Plan ${plan})`
        }
      },
      origin,
      mode: "payment",
      metadata: { type: "conversations", amount: "50", plan },
      successUrl: `${origin}/dashboard/plan?conversations_purchased=50`,
      cancelUrl: `${origin}/dashboard/plan`,
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  if (intent === "conversations_150") {
    const plan = formData.get("plan") as string || "FREE";
    const unitAmount = getConversationPrice(150, plan);

    const result = await createCheckoutSessionURL({
      user: null,
      priceData: {
        currency: 'mxn',
        unit_amount: unitAmount,
        product_data: {
          name: '150 Conversaciones',
          description: `150 conversaciones adicionales para tus chatbots (Plan ${plan})`
        }
      },
      origin,
      mode: "payment",
      metadata: { type: "conversations", amount: "150", plan },
      successUrl: `${origin}/dashboard/plan?conversations_purchased=150`,
      cancelUrl: `${origin}/dashboard/plan`,
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  if (intent === "conversations_500") {
    const plan = formData.get("plan") as string || "FREE";
    const unitAmount = getConversationPrice(500, plan);

    const result = await createCheckoutSessionURL({
      user: null,
      priceData: {
        currency: 'mxn',
        unit_amount: unitAmount,
        product_data: {
          name: '500 Conversaciones',
          description: `500 conversaciones adicionales para tus chatbots (Plan ${plan})`
        }
      },
      origin,
      mode: "payment",
      metadata: { type: "conversations", amount: "500", plan },
      successUrl: `${origin}/dashboard/plan?conversations_purchased=500`,
      cancelUrl: `${origin}/dashboard/plan`,
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  // Credits purchase intents (one-time payments)
  if (intent === "credits_100") {
    const result = await createCheckoutSessionURL({
      user: null,
      price: PRICES.credits_100,
      origin: new URL(request.url).origin,
      mode: "payment", // One-time payment, not subscription
      metadata: { type: "credits", amount: "100" },
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  // Credits purchases - Usando priceData dinámico

  if (intent === "credits_500") {
    const result = await createCheckoutSessionURL({
      user: null,
      priceData: {
        currency: 'mxn',
        unit_amount: 9900, // $99.00 MXN (en centavos)
        product_data: {
          name: '500 Créditos Parser',
          description: '500 créditos para usar el Parser API avanzado'
        }
      },
      origin,
      mode: "payment",
      metadata: { type: "credits", amount: "500" },
      successUrl: `${origin}/dashboard/api-keys?credits_purchased=500`,
      cancelUrl: `${origin}/dashboard/api-keys`,
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  if (intent === "credits_2000") {
    const result = await createCheckoutSessionURL({
      user: null,
      priceData: {
        currency: 'mxn',
        unit_amount: 34900, // $349.00 MXN (en centavos)
        product_data: {
          name: '2,000 Créditos Parser',
          description: '2,000 créditos para usar el Parser API avanzado'
        }
      },
      origin,
      mode: "payment",
      metadata: { type: "credits", amount: "2000" },
      successUrl: `${origin}/dashboard/api-keys?credits_purchased=2000`,
      cancelUrl: `${origin}/dashboard/api-keys`,
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  if (intent === "credits_5000") {
    const result = await createCheckoutSessionURL({
      user: null,
      priceData: {
        currency: 'mxn',
        unit_amount: 79900, // $799.00 MXN (en centavos)
        product_data: {
          name: '5,000 Créditos Parser',
          description: '5,000 créditos para usar el Parser API avanzado'
        }
      },
      origin,
      mode: "payment",
      metadata: { type: "credits", amount: "5000" },
      successUrl: `${origin}/dashboard/api-keys?credits_purchased=5000`,
      cancelUrl: `${origin}/dashboard/api-keys`,
    });
    if (result.type === 'checkout') return Response.redirect(result.url);
  }

  return new Response(null);
};

// Comentado: Versión anterior de enterprise_plan con priceData custom
// if (intent === "enterprise_plan") {
//   // Usar price_data para custom price en vez de price ID
//   const url = await createCheckoutSessionURL({
//     user: null,
//     priceData: {
//       currency: 'mxn',
//       unit_amount: 149900, // $1,499.00 MXN (en centavos)
//       recurring: { interval: 'month' },
//       product_data: {
//         name: 'Plan Enterprise',
//         description: 'Chatbots ilimitados, 1000 conversaciones, 5000 tool credits'
//       }
//     },
//     origin: new URL(request.url).origin,
//   });
//   if (url) return Response.redirect(url);
// }
