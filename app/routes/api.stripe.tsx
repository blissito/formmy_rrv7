import {  createCheckoutSessionURL } from "~/utils/stripe.server";
import type { Route } from "./+types/api.stripe";

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const isDevelopment = process.env.NODE_ENV === "development";

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
      :"price_1S5Cm2DtYmGT70YtwzUlp99P",
    // Credits one-time purchases - Price IDs reales de producción
    credits_500: "price_1SLwONRuGQeGCFrvx7YKBzMT", // $99 MXN
    credits_2000: "price_1SLwPBRuGQeGCFrvwVfKj8Lk", // $349 MXN
    credits_5000: "price_1SLwPqRuGQeGCFrvQZeRStNm", // $799 MXN
  };

  // New plan intents
  if (intent === "starter_plan") {
    const url = await createCheckoutSessionURL({
      user: null,
      price: PRICES.starter,
      origin: new URL(request.url).origin,
    });
    if (url) return Response.redirect(url);
  }

  if (intent === "pro_plan") {
    const url = await createCheckoutSessionURL({
      user: null,
      price: PRICES.pro,
      origin: new URL(request.url).origin,
    });
    if (url) return Response.redirect(url);
  }

  if (intent === "enterprise_plan") {
    const url = await createCheckoutSessionURL({
      user: null,
      price: PRICES.enterprise,
      origin: new URL(request.url).origin,
    });
    if (url) return Response.redirect(url);
  }

  // Credits purchase intents (one-time payments)
  if (intent === "credits_100") {
    const url = await createCheckoutSessionURL({
      user: null,
      price: PRICES.credits_100,
      origin: new URL(request.url).origin,
      mode: "payment", // One-time payment, not subscription
      metadata: { type: "credits", amount: "100" },
    });
    if (url) return Response.redirect(url);
  }

  // Credits purchases - Usando priceData dinámico
  const origin = new URL(request.url).origin;

  if (intent === "credits_500") {
    const url = await createCheckoutSessionURL({
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
    if (url) return Response.redirect(url);
  }

  if (intent === "credits_2000") {
    const url = await createCheckoutSessionURL({
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
    if (url) return Response.redirect(url);
  }

  if (intent === "credits_5000") {
    const url = await createCheckoutSessionURL({
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
    if (url) return Response.redirect(url);
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
