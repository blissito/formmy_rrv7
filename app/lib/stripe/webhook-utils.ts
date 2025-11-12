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
  customer_email?: string; // Email del customer
  status: SubscriptionStatus;
  current_period_end?: number; // Unix timestamp
  metadata?: Record<string, string>; // Metadatos de Stripe
  items?: {
    data: Array<{
      price: {
        id: string;
        product?: string | {
          id: string;
          name: string; // Para determinePlanFromSubscription
        };
      };
    }>;
  };
}

/**
 * Busca o crea un usuario basado en el customerId de Stripe.
 * Usado SOLO en subscription.created para permitir compras sin login.
 */
async function findOrCreateUserByCustomer(
  customerId: string,
  customerEmail?: string
): Promise<any | null> {
  // 1. Buscar por customerId
  let user = await db.user.findUnique({ where: { customerId } });
  if (user) return user;

  // 2. Si no existe y tenemos email, buscar por email
  if (customerEmail) {
    user = await db.user.findUnique({ where: { email: customerEmail } });

    if (user) {
      // Vincular customerId al usuario existente
      user = await db.user.update({
        where: { id: user.id },
        data: { customerId }
      });
      console.log(`[Webhook] CustomerId vinculado a usuario existente: ${customerEmail}`);
      return user;
    }

    // 3. Crear nuevo usuario
    user = await db.user.create({
      data: {
        email: customerEmail,
        name: customerEmail.split('@')[0],
        customerId,
        plan: 'FREE', // Se actualizará inmediatamente
      }
    });
    console.log(`[Webhook] Usuario creado desde Stripe: ${customerEmail}`);
    return user;
  }

  console.error(`[Webhook] No se pudo crear usuario sin email: ${customerId}`);
  return null;
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
  
}

/**
 * Determina el plan según el nombre del producto de Stripe
 */
function determinePlanFromSubscription(subscription: StripeSubscription): "STARTER" | "PRO" | "ENTERPRISE" {
  const product = subscription.items?.data[0]?.price?.product;

  if (product && typeof product === 'object' && product.name) {
    const productName = product.name.toLowerCase();

    // Buscar palabras clave en el nombre del producto
    if (productName.includes('enterprise')) return 'ENTERPRISE';
    if (productName.includes('starter')) return 'STARTER';
    if (productName.includes('pro')) return 'PRO';
  }

  // Default a PRO si no se puede determinar
  console.warn('[Webhook] No se pudo determinar el plan del producto, defaulting a PRO', {
    productType: typeof product,
    productName: product && typeof product === 'object' ? product.name : 'N/A',
    subscriptionId: subscription.id
  });

  return 'PRO';
}

/**
 * Maneja la creación de una nueva suscripción
 */
export async function handleSubscriptionCreated(
  subscription: StripeSubscription
) {
  const customerId = subscription.customer;

  // UPSERT: Buscar o crear usuario (permite compra sin login)
  const user = await findOrCreateUserByCustomer(customerId, subscription.customer_email);

  if (!user) {
    console.warn(
      `[Webhook] No se pudo obtener/crear usuario para: ${customerId}`
    );
    return;
  }

  // Cargar referrals si existen (necesario para conversión)
  const userWithReferrals = await db.user.findUnique({
    where: { id: user.id },
    include: {
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
  if (userWithReferrals?.referrals && userWithReferrals.referrals.length > 0) {
    const result = await Effect.runPromise(
      referralService.trackProConversion(user.id)
    );

    if (result.success) {
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

  // Solo actualizar si la suscripción está activa
  if (subscription.status === "active") {
    const newPlan = determinePlanFromSubscription(subscription);

    // Manejar subscriptionIds sin sobrescribir
    const subscriptionIds = user.subscriptionIds || [];
    if (!subscriptionIds.includes(subscription.id)) {
      subscriptionIds.push(subscription.id);
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        plan: newPlan,
        subscriptionIds,
      },
    });

    // Actualizar modelos de chatbots según el nuevo plan
    await updateUserChatbotModels(user.id, newPlan);

    console.log(`[Webhook] Plan actualizado: ${user.id} → ${newPlan}`);
  } else {
    console.log(
      `[Webhook] Suscripción no activa: ${subscription.id} (${subscription.status})`
    );
  }
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

  // Verificar metadata
  const metadata = session.metadata;

  if (!metadata || !metadata.type) {
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
