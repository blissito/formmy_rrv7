import { db } from '~/utils/db.server';
import { Effect } from 'effect';

/**
 * Servicio para manejar la lógica de referidos
 */

export interface ReferralService {
  trackProConversion: (userId: string) => Effect.Effect<{ success: boolean; message: string }, { _tag: string; message: string }>;
  applyReferralCredit: (referrerId: string, amount: number) => Promise<void>;
}

export const referralService: ReferralService = {
  /**
   * Registra una conversión a Pro para un usuario referido
   */
  trackProConversion: (userId: string) =>
    Effect.gen(function* () {
      // Buscar si el usuario fue referido
      const referredUser = yield* Effect.tryPromise({
        try: () =>
          db.user.findUnique({
            where: { id: userId },
            include: { referredBy: true },
          }),
        catch: (error) => ({
          _tag: 'DatabaseError' as const,
          message: `Error al buscar usuario: ${error.message}`,
        }),
      });

      if (!referredUser) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      // Si el usuario no fue referido, retornar éxito
      if (!referredUser.referredBy) {
        return { success: true, message: 'Usuario no referido - nada que hacer' };
      }

      // Actualizar el contador de conversiones exitosas
      yield* Effect.tryPromise({
        try: () =>
          db.referral.update({
            where: { referrerId: referredUser.referredBy.id },
            data: {
              successfulConversions: { increment: 1 },
            },
          }),
        catch: (error) => ({
          _tag: 'DatabaseError' as const,
          message: `Error al actualizar contador de referidos: ${error.message}`,
        }),
      });

      // Aplicar crédito al referente
      yield* Effect.tryPromise({
        try: () => referralService.applyReferralCredit(referredUser.referredBy.id, 10), // $10 de crédito
        catch: (error) => ({
          _tag: 'ReferralCreditError' as const,
          message: `Error al aplicar crédito de referido: ${error.message}`,
        }),
      });

      return { success: true, message: 'Conversión a Pro registrada exitosamente' };
    }).pipe(
      Effect.catchAll((error) =>
        Effect.succeed({
          success: false,
          message: `Error al procesar conversión: ${error.message}`,
        })
      )
    ),

  /**
   * Aplica crédito a la cuenta del referente
   */
  applyReferralCredit: async (referrerId: string, amount: number) => {
    // Aquí iría la lógica para aplicar el crédito en Stripe
    // Por ahora solo lo registramos en los logs
    console.log(`Aplicando crédito de $${amount} al referente ${referrerId}`);
    
    // TODO: Implementar lógica real con Stripe
    // await stripe.invoiceItems.create({
    //   customer: customerId,
    //   amount: amount * 100, // Convertir a centavos
    //   currency: 'usd',
    //   description: 'Crédito por referido exitoso',
    // });
  },
};
