import { data as json } from "react-router";
import type { Route } from "./+types/api.v1.integrations.messenger.webhook";
import { db } from "~/utils/db.server";

/**
 * Messenger Webhook Handler
 * https://developers.facebook.com/docs/messenger-platform/webhooks
 */

// Types for Messenger webhook payload
interface MessengerWebhookEntry {
  id: string; // Page ID
  time: number;
  messaging: Array<{
    sender: {
      id: string; // PSID (Page-Scoped ID)
    };
    recipient: {
      id: string; // Page ID
    };
    timestamp: number;
    message?: {
      mid: string; // Message ID
      text?: string;
      attachments?: Array<{
        type: "image" | "audio" | "video" | "file";
        payload: {
          url: string;
        };
      }>;
      quick_reply?: {
        payload: string;
      };
    };
    postback?: {
      title: string;
      payload: string;
    };
    delivery?: {
      mids: string[];
      watermark: number;
    };
    read?: {
      watermark: number;
    };
    reaction?: {
      mid: string;
      action: "react" | "unreact";
      emoji?: string;
      reaction?: string;
    };
  }>;
}

interface MessengerWebhookPayload {
  object: "page";
  entry: MessengerWebhookEntry[];
}

/**
 * Loader function - handles GET requests for webhook verification
 * Meta sends a GET request to verify the webhook endpoint
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("📬 [Messenger Webhook] Verification request:", { mode, token });

    // Verify that this is a webhook verification request
    if (mode !== "subscribe") {
      console.warn(`❌ [Messenger Webhook] Invalid mode: ${mode}. Expected 'subscribe'`);
      return new Response("Invalid mode", { status: 400 });
    }

    // Verificar token contra integraciones existentes o variable de entorno
    let isValidToken = false;

    // 1. Verificar contra variable de entorno (para testing manual)
    const envToken = process.env.MESSENGER_WEBHOOK_VERIFY_TOKEN;
    if (envToken && token === envToken) {
      isValidToken = true;
      console.log("✅ [Messenger Webhook] Token verified via ENV");
    }

    // 2. Verificar contra tokens dinámicos de integraciones
    if (!isValidToken && token) {
      const integration = await db.integration.findFirst({
        where: {
          platform: "MESSENGER",
          webhookVerifyToken: token,
        },
      });

      if (integration) {
        isValidToken = true;
        console.log(`✅ [Messenger Webhook] Token verified via DB (integration: ${integration.id})`);
      }
    }

    if (!isValidToken) {
      console.warn("❌ [Messenger Webhook] Token verification failed");
      return new Response("Forbidden", { status: 403 });
    }

    if (!challenge) {
      console.warn("❌ [Messenger Webhook] No challenge provided");
      return new Response("No challenge provided", { status: 400 });
    }

    console.log("✅ [Messenger Webhook] Verification successful");
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("❌ [Messenger Webhook] Verification failed:", error);
    return new Response("Verification failed", { status: 500 });
  }
};

/**
 * Action function - handles POST requests for incoming webhooks
 * Processes incoming Messenger messages and events
 */
export const action = async ({ request }: Route.ActionArgs) => {
  try {
    const payload = (await request.json()) as MessengerWebhookPayload;

    console.log("📬 [Messenger Webhook] Incoming payload:", JSON.stringify(payload, null, 2));

    // Validate payload object type
    if (payload.object !== "page") {
      console.warn("❌ [Messenger Webhook] Invalid object type:", payload.object);
      return json({ success: false, error: "Invalid object type" }, { status: 400 });
    }

    const results = [];

    // Process each entry in the webhook
    for (const entry of payload.entry || []) {
      const pageId = entry.id;

      console.log(`📄 [Messenger Webhook] Processing entry for page ${pageId}`);

      // Find integration by pageId
      const integration = await db.integration.findFirst({
        where: {
          platform: "MESSENGER",
          pageId,
          isActive: true,
        },
      });

      if (!integration) {
        console.warn(`⚠️ [Messenger Webhook] No integration found for page ${pageId}`);
        results.push({
          success: false,
          pageId,
          error: "Integration not found",
        });
        continue;
      }

      // Process messaging events
      for (const event of entry.messaging || []) {
        try {
          const senderId = event.sender.id;
          const timestamp = event.timestamp;

          console.log(`💬 [Messenger Webhook] Event from sender ${senderId}:`, {
            hasMessage: !!event.message,
            hasPostback: !!event.postback,
            hasDelivery: !!event.delivery,
            hasRead: !!event.read,
            hasReaction: !!event.reaction,
          });

          // Handle message event
          if (event.message) {
            const messageId = event.message.mid;
            const messageText = event.message.text || "";
            const attachments = event.message.attachments || [];

            console.log(`📨 [Messenger Webhook] Message received:`, {
              messageId,
              text: messageText,
              attachments: attachments.length,
            });

            // TODO: Process message and generate chatbot response
            // For now, just log and acknowledge

            results.push({
              success: true,
              type: "message",
              pageId,
              senderId,
              messageId,
              text: messageText,
              attachments: attachments.length,
            });
          }

          // Handle postback event (button clicks, Get Started, etc.)
          if (event.postback) {
            const postbackPayload = event.postback.payload;
            const postbackTitle = event.postback.title;

            console.log(`🔘 [Messenger Webhook] Postback received:`, {
              title: postbackTitle,
              payload: postbackPayload,
            });

            // TODO: Handle postback events

            results.push({
              success: true,
              type: "postback",
              pageId,
              senderId,
              payload: postbackPayload,
              title: postbackTitle,
            });
          }

          // Handle delivery confirmation
          if (event.delivery) {
            console.log(`✅ [Messenger Webhook] Delivery confirmation:`, {
              mids: event.delivery.mids.length,
            });

            results.push({
              success: true,
              type: "delivery",
              pageId,
              senderId,
              delivered: event.delivery.mids.length,
            });
          }

          // Handle read receipt
          if (event.read) {
            console.log(`👁️ [Messenger Webhook] Read receipt`);

            results.push({
              success: true,
              type: "read",
              pageId,
              senderId,
            });
          }

          // Handle message reaction
          if (event.reaction) {
            console.log(`❤️ [Messenger Webhook] Message reaction:`, {
              action: event.reaction.action,
              emoji: event.reaction.emoji || event.reaction.reaction,
            });

            results.push({
              success: true,
              type: "reaction",
              pageId,
              senderId,
              action: event.reaction.action,
              emoji: event.reaction.emoji || event.reaction.reaction,
            });
          }
        } catch (eventError) {
          console.error("❌ [Messenger Webhook] Error processing event:", eventError);
          results.push({
            success: false,
            pageId,
            error: eventError instanceof Error ? eventError.message : "Unknown error",
          });
        }
      }
    }

    console.log(`✅ [Messenger Webhook] Processed ${results.length} events`);

    return json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("❌ [Messenger Webhook] Processing failed:", error);

    return json(
      {
        success: false,
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
