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
      :"price_1S5Cm2DtYmGT70YtwzUlp99P"
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
