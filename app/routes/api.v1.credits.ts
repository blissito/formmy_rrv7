import type { Route } from "./+types/api.v1.credits";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { addPurchasedCredits, getAvailableCredits } from "server/llamaparse/credits.service";

/**
 * GET /api/v1/credits - Obtener balance de créditos del usuario
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  try {
    const credits = await getAvailableCredits(user.id);

    return Response.json({
      success: true,
      credits,
    });
  } catch (error) {
    console.error("Error getting credits:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
};

/**
 * POST /api/v1/credits?intent=purchase - Comprar créditos adicionales
 * (Aquí se integraría con Stripe en el futuro)
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  if (intent === "purchase") {
    const formData = await request.formData();
    const amount = parseInt(formData.get("amount") as string);

    if (!amount || amount <= 0) {
      return Response.json(
        {
          success: false,
          error: "Cantidad de créditos inválida",
        },
        { status: 400 }
      );
    }

    try {
      // TODO: Integrar con Stripe para cobrar
      // Por ahora, solo agregar los créditos (demo mode)
      const result = await addPurchasedCredits(user.id, amount);

      return Response.json({
        success: true,
        message: `${amount} créditos agregados exitosamente`,
        newBalance: result.newBalance,
      });
    } catch (error) {
      console.error("Error purchasing credits:", error);
      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 500 }
      );
    }
  }

  return Response.json(
    {
      success: false,
      error: "Intent no reconocido",
    },
    { status: 400 }
  );
};
