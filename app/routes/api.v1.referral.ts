import { Effect } from "effect";
import {
  createReferralCode,
  findReferralByCode,
  processReferral,
} from "~/models/referral.server";

// Types
type ReferralStats = {
  referredCount: number;
  successfulConversions: number;
};

type ReferralResponse = {
  success: boolean;
  message?: string;
  code?: string;
  error?: string;
  stats?: ReferralStats;
};

// Helpers
const createResponse = (data: ReferralResponse, status = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Effect-based handlers
const generateReferralCode = (userId: string) =>
  Effect.tryPromise({
    try: async () => {
      const referral = await createReferralCode(userId);
      return createResponse({
        success: true,
        message: "Código de referido generado exitosamente",
        code: referral.referralCode,
        stats: {
          referredCount: referral.referredCount,
          successfulConversions: referral.successfulConversions,
        },
      });
    },
    catch: (error) => {
      console.error("Error generating referral code:", error);
      return createResponse(
        { success: false, error: "Error al generar código de referido" },
        500
      );
    },
  });

const getReferralStats = (code: string) =>
  Effect.tryPromise({
    try: async () => {
      const referralData = await findReferralByCode(code);

      if (!referralData) {
        return createResponse(
          { success: false, error: "Código de referido no encontrado" },
          404
        );
      }

      return createResponse({
        success: true,
        stats: {
          referredCount: referralData.referredCount,
          successfulConversions: referralData.successfulConversions,
        },
      });
    },
    catch: (error) => {
      console.error("Error getting referral stats:", error);
      return createResponse(
        { success: false, error: "Error al obtener estadísticas" },
        500
      );
    },
  });

// Main handler - React Router v7 style with action using Effect
export async function action({
  request,
}: {
  request: Request;
}): Promise<Response> {
  const actionEffect = Effect.gen(function* () {
    // Parse form data
    const formData = yield* Effect.tryPromise({
      try: () => request.formData(),
      catch: (error) => new Error(`Failed to parse form data: ${error}`),
    });

    const intent = formData.get("intent") as string;

    // TODO: Implementar autenticación real usando Effect
    // const userId = yield* getUserFromRequest(request);
    const userId = "temp-user-id"; // Placeholder

    switch (intent) {
      case "generate_code":
        return yield* generateReferralCode(userId);

      case "get_stats":
        const code = formData.get("code") as string;
        if (!code) {
          return createResponse(
            { success: false, error: "Código requerido" },
            400
          );
        }
        return yield* getReferralStats(code);

      case "process_referral":
        const referralCode = formData.get("code") as string;
        const referredUserId = formData.get("userId") as string;

        if (!referralCode || !referredUserId) {
          return createResponse(
            {
              success: false,
              error:
                "Se requieren tanto el código de referido como el ID del usuario",
            },
            400
          );
        }

        const result = yield* processReferral(referredUserId, referralCode);
        return createResponse(result);

      default:
        return createResponse(
          { success: false, error: "Acción no válida" },
          400
        );
    }
  }).pipe(
    Effect.catchAll((error) => {
      console.error("Error in referral endpoint:", error);
      return Effect.succeed(
        createResponse(
          { success: false, error: "Error interno del servidor" },
          500
        )
      );
    })
  );

  return Effect.runPromise(actionEffect);
}
