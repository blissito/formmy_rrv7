import { getStripeURL } from "~/utils/stripe.server";
import type { Route } from "./+types/api.stripe";

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "monthly-suscription") {
    const url = await getStripeURL(request, "month"); // 8usd/month
    if (url) return Response.redirect(url);
  }

  if (intent === "anual_suscription") {
    const url = await getStripeURL(request);
    if (url) return Response.redirect(url);
  }
  return new Response(null);
};
