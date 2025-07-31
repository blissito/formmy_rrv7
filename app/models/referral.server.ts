import { nanoid } from "nanoid";
import { db } from "~/utils/db.server";
import { Effect } from "effect";

// Interfaz para el modelo de Referido
export interface Referral {
  id: string;
  referrerId: string; // ID del usuario que refiere
  referralCode: string; // Código único de referencia
  referredCount: number; // Número de referidos
  successfulConversions: number; // Número de conversiones exitosas a Pro
  createdAt: Date;
  updatedAt: Date;
}

// Genera un código de referencia aleatorio
export const generateReferralCode = (length: number = 4) => nanoid(length);

// Crea un nuevo código de referencia para un usuario
export async function createReferralCode(userId: string): Promise<Referral> {
  // Verificar si ya existe un código para este usuario
  const existingReferral = await db.referral.findFirst({
    where: { referrerId: userId },
  });

  if (existingReferral) {
    return existingReferral;
  }

  // Crear un nuevo código de referencia
  let referralCode: string;
  let isCodeUnique = false;

  // Asegurarse de que el código sea único
  while (!isCodeUnique) {
    referralCode = generateReferralCode();
    const existingCode = await db.referral.findUnique({
      where: { referralCode },
    });

    if (!existingCode) {
      isCodeUnique = true;
    }
  }

  // Crear el registro de referencia
  return await db.referral.create({
    data: {
      referrerId: userId,
      referralCode: referralCode!,
      referredCount: 0,
      successfulConversions: 0,
    },
  });
}

// Encuentra un referido por su código
export async function findReferralByCode(
  code: string
): Promise<Referral | null> {
  return await db.referral.findUnique({
    where: { referralCode: code },
  });
}
// Encuentra un referido por el ID del referente
export async function findReferralByUserId(
  userId: string
): Promise<Referral | null> {
  return await db.referral.findFirst({
    where: { referrerId: userId },
  });
}

// Procesa un nuevo referido
export function processReferral(
  referredUserId: string,
  code: string
): Effect.Effect<
  { success: boolean; message: string },
  { _tag: string; message: string }
> {
  return Effect.gen(function* () {
    // 1. Validar que el código existe
    const referral = yield* Effect.tryPromise({
      try: () => findReferralByCode(code),
      catch: () => new Error("Error al buscar el código de referido"),
    });

    if (!referral) {
      return {
        success: false,
        message: "Código de referido no válido",
      };
    }

    // 2. Verificar que el usuario no se está refiriendo a sí mismo
    if (referral.referrerId === referredUserId) {
      return {
        success: false,
        message: "No puedes referirte a ti mismo",
      };
    }

    // 3. Registrar el referido
    yield* Effect.tryPromise({
      try: () =>
        db.referral.update({
          where: { id: referral.id },
          data: {
            referredCount: { increment: 1 },
          },
        }),
      catch: () => new Error("Error al actualizar el contador de referidos"),
    });

    return {
      success: true,
      message: "¡Referido registrado exitosamente!",
    };
  }).pipe(
    Effect.catchAll((error) =>
      Effect.succeed({
        success: false,
        message: error.message,
      })
    )
  );
}
