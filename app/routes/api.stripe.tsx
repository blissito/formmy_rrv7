import { getStripeURL } from "~/utils/stripe.server";
import type { Route } from "./+types/api.stripe";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  if (intent === "anual_suscription") {
    const url = await getStripeURL(request);
    if (!url) return new Response(url);

    return Response.redirect(url);
  }
};
