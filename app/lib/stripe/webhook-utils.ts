import { db } from "~/utils/db.server";
import { Effect } from "effect";
import { referralService } from "~/services/referral.service";

import { sendProEmail } from "server/notifyers/pro";
import { sendStarterEmail } from "server/notifyers/starter";
import { sendEnterpriseEmail } from "server/notifyers/enterprise";
import { sendPlanCancellation } from "server/notifyers/planCancellation";

import { getDefaultModelForPlan } from "~/utils/aiModels";
import { addPurchasedCredits } from "server/llamaparse/credits.service";


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
  metadata?: Record<string, string>; // Metadatos de Stripe
  items?: {
    data: Array<{
      price: {
        id: string;
      };
    }>;
  };
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
 * Determina el plan según el price ID o metadata de Stripe
 */
function determinePlanFromSubscription(subscription: StripeSubscription): "STARTER" | "PRO" | "ENTERPRISE" {
  // Primero chequear metadata (usado por Enterprise)
  if (subscription.metadata?.plan === 'ENTERPRISE') {
    return 'ENTERPRISE';
  }

  // Obtener el price ID del primer item de la suscripción
  const priceId = subscription.items?.data[0]?.price?.id;

  if (!priceId) {
    console.warn('[Webhook] No se pudo determinar el price ID, defaulting a PRO');
    return 'PRO';
  }

  // Price IDs de producción
  const PRICE_IDS = {
    STARTER: 'price_1S5AqXDtYmGT70YtepLAzwk4',
    PRO: 'price_1S5CqADtYmGT70YtTZUtJOiS',
  };

  // Determinar plan basado en price ID
  if (priceId === PRICE_IDS.STARTER) {
    return 'STARTER';
  } else if (priceId === PRICE_IDS.PRO) {
    return 'PRO';
  }

  // Default a PRO si no coincide
  console.warn(`[Webhook] Price ID desconocido: ${priceId}, defaulting a PRO`);
  return 'PRO';
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

  // Determinar el plan según la suscripción
  const plan = determinePlanFromSubscription(subscription);

  // Actualizar el plan del usuario
  await db.user.update({
    where: { id: user.id },
    data: {
      plan,
      subscriptionIds: { push: subscription.id },
    },
  });

  // Actualizar modelos de chatbots según el nuevo plan
  await updateUserChatbotModels(user.id, plan);

  console.log(
    `[Webhook] Suscripción ${plan} creada para el usuario: ${user.email}`
  );

  // Enviar email según el plan
  try {
    if (plan === 'ENTERPRISE') {
      await sendEnterpriseEmail({ email: user.email, name: user.name });
    } else if (plan === 'PRO') {
      await sendProEmail({ email: user.email, name: user.name });
    } else if (plan === 'STARTER') {
      await sendStarterEmail({ email: user.email, name: user.name });
    }
  } catch (error) {
    console.error(`Error sending ${plan} upgrade email:`, error);
  }

  // Si el usuario fue referido, registrar la conversión
  if (user.referrals && user.referrals.length > 0) {
    const result = await Effect.runPromise(
      referralService.trackProConversion(user.id)
    );

    if (result.success) {
      console.log(
        `[Webhook] Conversión a ${plan} registrada para referido: ${user.email}`
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

  // Guardar el plan actual antes de actualizarlo
  const currentPlan = user.plan as "Starter" | "Pro" | "Enterprise" | "FREE";

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

    // Solo enviar email si el plan cancelado no es FREE
    if (currentPlan !== "FREE") {
      await sendPlanCancellation({
        email: user.email,
        endDate,
        planName: currentPlan as "Starter" | "Pro" | "Enterprise"
      });
    }
  } catch (error) {
    console.error('Error sending plan cancellation email:', error);
  }
}

/**
 * Maneja completado de checkout (one-time payments como compra de créditos o conversaciones)
 */
export async function handleCheckoutCompleted(session: any) {
  console.log(`[Webhook] Processing checkout.session.completed: ${session.id}`);

  // Verificar metadata
  const metadata = session.metadata;

  if (!metadata || !metadata.type) {
    console.log("[Webhook] Checkout session sin metadata de tipo, ignorando");
    return;
  }

  const customerId = session.customer;

  // Buscar usuario por customerId
  const user = await db.user.findUnique({
    where: { customerId },
  });

  if (!user) {
    console.warn(
      `[Webhook] Usuario no encontrado para el cliente de Stripe: ${customerId}`
    );
    return;
  }

  // Manejar según tipo de compra
  if (metadata.type === "credits") {
    await handleCreditsPurchase(user, metadata);
  } else if (metadata.type === "conversations") {
    await handleConversationsPurchase(user, metadata);
  } else {
    console.log(`[Webhook] Tipo de compra desconocido: ${metadata.type}`);
  }
}

/**
 * Maneja compra de créditos
 */
async function handleCreditsPurchase(user: any, metadata: any) {
  const creditsAmount = parseInt(metadata.amount);

  if (!creditsAmount || creditsAmount <= 0) {
    console.error("[Webhook] Cantidad de créditos inválida en metadata:", metadata.amount);
    return;
  }

  try {
    const result = await addPurchasedCredits(user.id, creditsAmount);

    console.log(
      `[Webhook] ✅ ${creditsAmount} créditos agregados a ${user.email}. Nuevo balance: ${result.newBalance}`
    );

    // Enviar email de confirmación de compra
    try {
      const { sendCreditsPurchaseEmail } = await import("server/notifyers/creditsPurchase");
      await sendCreditsPurchaseEmail({
        email: user.email,
        name: user.name || undefined,
        credits: creditsAmount,
        newBalance: result.newBalance
      });
    } catch (emailError) {
      console.error("[Webhook] Error enviando email de compra de créditos:", emailError);
    }
  } catch (error) {
    console.error("[Webhook] Error agregando créditos:", error);
  }
}

/**
 * Maneja compra de conversaciones adicionales
 */
async function handleConversationsPurchase(user: any, metadata: any) {
  const conversationsAmount = parseInt(metadata.amount);

  if (!conversationsAmount || conversationsAmount <= 0) {
    console.error("[Webhook] Cantidad de conversaciones inválida en metadata:", metadata.amount);
    return;
  }

  try {
    // Actualizar purchasedConversations en el usuario
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        purchasedConversations: {
          increment: conversationsAmount
        }
      }
    });

    console.log(
      `[Webhook] ✅ ${conversationsAmount} conversaciones agregadas a ${user.email}. Nuevo total: ${updatedUser.purchasedConversations}`
    );

    // Enviar email de confirmación de compra
    try {
      const { sendConversationsPurchaseEmail } = await import("server/notifyers/conversationsPurchase");
      await sendConversationsPurchaseEmail({
        email: user.email,
        name: user.name || undefined,
        conversations: conversationsAmount,
        newTotal: updatedUser.purchasedConversations
      });
    } catch (emailError) {
      console.error("[Webhook] Error enviando email de compra de conversaciones:", emailError);
    }
  } catch (error) {
    console.error("[Webhook] Error agregando conversaciones:", error);
  }
}
