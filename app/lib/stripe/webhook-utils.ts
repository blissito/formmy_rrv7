import { db } from "~/utils/db.server";
import { Effect } from "effect";
import { referralService } from "~/services/referral.service";

import { sendProEmail } from "~/utils/notifyers/pro";
import { sendPlanCancellation } from "~/utils/notifyers/planCancellation";

import { getDefaultModelForPlan } from "~/utils/aiModels";


type SubscriptionStatus =
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "trialing";

export interface StripeSubscription {
  id: string;
  customer: string;
  status: SubscriptionStatus;
  current_period_end?: number; // Unix timestamp
  // Otros campos de Stripe que podamos necesitar
}

/**
 * Actualiza los modelos de IA de todos los chatbots del usuario según su nuevo plan
 */
async function updateUserChatbotModels(userId: string, newPlan: string) {
  const defaultModel = getDefaultModelForPlan(newPlan);
  
  // Solo actualizar chatbots que no tengan un modelo específico configurado
  // o que tengan un modelo que ya no esté disponible en su plan
  await db.chatbot.updateMany({
    where: {
      userId,
      OR: [
        { aiModel: null },
        { aiModel: "" },
        // Podrías agregar aquí lógica para cambiar modelos que ya no están disponibles
      ]
    },
    data: {
      aiModel: defaultModel
    }
  });
  
  console.log(`[Webhook] Modelos de chatbots actualizados para el usuario ${userId} con plan ${newPlan}, modelo por defecto: ${defaultModel}`);
}

/**
 * Maneja la creación de una nueva suscripción
 */
export async function handleSubscriptionCreated(
  subscription: StripeSubscription
) {
  const customerId = subscription.customer;
  const user = await db.user.findUnique({
    where: { customerId },
    include: {
      // Incluir la relación con el usuario que lo refirió
      referrals: {
        select: {
          id: true,
          referrer: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.warn(
      `[Webhook] Usuario no encontrado para el cliente de Stripe: ${customerId}`
    );
    return;
  }

  // Actualizar el plan del usuario a PRO
  await db.user.update({
    where: { id: user.id },
    data: {
      plan: "PRO",
      subscriptionIds: { push: subscription.id },
    },
  });

  // Actualizar modelos de chatbots según el nuevo plan
  await updateUserChatbotModels(user.id, "PRO");

  console.log(
    `[Webhook] Suscripción PRO creada para el usuario: ${user.email}`
  );

  // Send PRO upgrade email
  try {
    await sendProEmail({ email: user.email, name: user.name });
  } catch (error) {
    console.error('Error sending PRO upgrade email:', error);
  }

  // Si el usuario fue referido, registrar la conversión
  if (user.referrals && user.referrals.length > 0) {
    const result = await Effect.runPromise(
      referralService.trackProConversion(user.id)
    );

    if (result.success) {
      console.log(
        `[Webhook] Conversión a Pro registrada para referido: ${user.email}`
      );
    } else {
      console.error(
        `[Webhook] Error al registrar conversión para referido: ${result.message}`
      );
    }
  }
}

/**
 * Maneja la actualización de una suscripción existente
 */
export async function handleSubscriptionUpdated(subscription: StripeSubscription) {
  const customerId = subscription.customer;
  const user = await db.user.findUnique({ where: { customerId } });

  if (!user) {
    console.warn(
      `[Webhook] Usuario no encontrado para el cliente de Stripe: ${customerId}`
    );
    return;
  }

  const isActive = subscription.status === "active";
  const newPlan = isActive ? "PRO" : "FREE";

  await db.user.update({
    where: { id: user.id },
    data: {
      plan: newPlan,
      subscriptionIds: [subscription.id],
    },
  });

  // Actualizar modelos de chatbots según el nuevo plan
  await updateUserChatbotModels(user.id, newPlan);

  console.log(
    `[Webhook] Suscripción actualizada para ${user.email}: ${subscription.status}`
  );
}

/**
 * Maneja la eliminación de una suscripción
 */
export async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  const customerId = subscription.customer;
  const user = await db.user.findUnique({ where: { customerId } });

  if (!user) {
    console.warn(
      `[Webhook] Usuario no encontrado para el cliente de Stripe: ${customerId}`
    );
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      subscriptionIds:
        user.subscriptionIds?.filter((id) => id !== subscription.id) ?? [],
    },
  });

  // Actualizar modelos de chatbots según el nuevo plan FREE
  await updateUserChatbotModels(user.id, "FREE");

  console.log(`[Webhook] Suscripción eliminada para: ${user.email}`);

  // Send cancellation email
  try {
    // Format end date from Unix timestamp to Spanish date format
    const endDate = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : "31 de diciembre de 2025"; // Fallback date
    
    await sendPlanCancellation({ 
      email: user.email,
      endDate 
    });
  } catch (error) {
    console.error('Error sending plan cancellation email:', error);
  }
}
