import { data as json } from "react-router";
import { db } from "../utils/db.server";

/**
 * Instagram Webhook Handler
 * https://developers.facebook.com/docs/instagram-platform/webhooks
 */

// Types for Instagram webhook payload
interface InstagramWebhookEntry {
  id: string; // Instagram Business Account ID
  time: number;
  messaging: Array<{
    sender: {
      id: string; // Instagram-Scoped ID (IGSID)
    };
    recipient: {
      id: string; // Instagram Business Account ID
    };
    timestamp: number;
    message?: {
      mid: string; // Message ID
      text?: string;
      attachments?: Array<{
        type: "image" | "audio" | "video" | "file" | "story_mention" | "share";
        payload: {
          url: string;
        };
      }>;
      quick_reply?: {
        payload: string;
      };
      is_deleted?: boolean;
      reply_to?: {
        mid: string;
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

interface InstagramWebhookPayload {
  object: "instagram";
  entry: InstagramWebhookEntry[];
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

    console.log("📬 [Instagram Webhook] Verification request:", { mode, token });

    // Verify that this is a webhook verification request
    if (mode !== "subscribe") {
      console.warn(`❌ [Instagram Webhook] Invalid mode: ${mode}. Expected 'subscribe'`);
      return new Response("Invalid mode", { status: 400 });
    }

    // Verificar token contra integraciones existentes o variable de entorno
    let isValidToken = false;

    // 1. Verificar contra variable de entorno (para testing manual)
    const envToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    if (envToken && token === envToken) {
      isValidToken = true;
      console.log("✅ [Instagram Webhook] Token verified via ENV");
    }

    // 2. Verificar contra tokens dinámicos de integraciones
    if (!isValidToken && token) {
      const integration = await db.integration.findFirst({
        where: {
          platform: "INSTAGRAM",
          webhookVerifyToken: token,
        },
      });

      if (integration) {
        isValidToken = true;
        console.log(`✅ [Instagram Webhook] Token verified via DB (integration: ${integration.id})`);
      }
    }

    if (!isValidToken) {
      console.warn("❌ [Instagram Webhook] Token verification failed");
      return new Response("Forbidden", { status: 403 });
    }

    if (!challenge) {
      console.warn("❌ [Instagram Webhook] No challenge provided");
      return new Response("No challenge provided", { status: 400 });
    }

    console.log("✅ [Instagram Webhook] Verification successful");
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("❌ [Instagram Webhook] Verification failed:", error);
    return new Response("Verification failed", { status: 500 });
  }
};

/**
 * Action function - handles POST requests for incoming webhooks
 * Processes incoming Instagram messages and events
 */
export const action = async ({ request }: Route.ActionArgs) => {
  try {
    const payload = (await request.json()) as InstagramWebhookPayload;

    console.log("📬 [Instagram Webhook] Incoming payload:", JSON.stringify(payload, null, 2));

    // Validate payload object type
    if (payload.object !== "instagram") {
      console.warn("❌ [Instagram Webhook] Invalid object type:", payload.object);
      return json({ success: false, error: "Invalid object type" }, { status: 400 });
    }

    const results = [];

    // Process each entry in the webhook
    for (const entry of payload.entry || []) {
      const instagramUserId = entry.id;

      console.log(`📄 [Instagram Webhook] Processing entry for account ${instagramUserId}`);

      // Find integration by instagramUserId
      const integration = await db.integration.findFirst({
        where: {
          platform: "INSTAGRAM",
          instagramUserId,
          isActive: true,
        },
      });

      if (!integration) {
        console.warn(`⚠️ [Instagram Webhook] No integration found for account ${instagramUserId}`);
        results.push({
          success: false,
          instagramUserId,
          error: "Integration not found",
        });
        continue;
      }

      // Process messaging events
      for (const event of entry.messaging || []) {
        try {
          const senderId = event.sender.id;
          const timestamp = event.timestamp;

          console.log(`💬 [Instagram Webhook] Event from sender ${senderId}:`, {
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
            const isDeleted = event.message.is_deleted || false;
            const replyTo = event.message.reply_to?.mid;

            console.log(`📨 [Instagram Webhook] Message received:`, {
              messageId,
              text: messageText,
              attachments: attachments.length,
              isDeleted,
              replyTo,
            });

            // TODO: Process message and generate chatbot response
            // For now, just log and acknowledge

            results.push({
              success: true,
              type: "message",
              instagramUserId,
              senderId,
              messageId,
              text: messageText,
              attachments: attachments.length,
              isDeleted,
            });
          }

          // Handle postback event (button clicks, ice breakers, etc.)
          if (event.postback) {
            const postbackPayload = event.postback.payload;
            const postbackTitle = event.postback.title;

            console.log(`🔘 [Instagram Webhook] Postback received:`, {
              title: postbackTitle,
              payload: postbackPayload,
            });

            // TODO: Handle postback events

            results.push({
              success: true,
              type: "postback",
              instagramUserId,
              senderId,
              payload: postbackPayload,
              title: postbackTitle,
            });
          }

          // Handle delivery confirmation
          if (event.delivery) {
            console.log(`✅ [Instagram Webhook] Delivery confirmation:`, {
              mids: event.delivery.mids.length,
            });

            results.push({
              success: true,
              type: "delivery",
              instagramUserId,
              senderId,
              delivered: event.delivery.mids.length,
            });
          }

          // Handle read receipt
          if (event.read) {
            console.log(`👁️ [Instagram Webhook] Read receipt`);

            results.push({
              success: true,
              type: "read",
              instagramUserId,
              senderId,
            });
          }

          // Handle message reaction
          if (event.reaction) {
            console.log(`❤️ [Instagram Webhook] Message reaction:`, {
              action: event.reaction.action,
              emoji: event.reaction.emoji || event.reaction.reaction,
            });

            results.push({
              success: true,
              type: "reaction",
              instagramUserId,
              senderId,
              action: event.reaction.action,
              emoji: event.reaction.emoji || event.reaction.reaction,
            });
          }
        } catch (eventError) {
          console.error("❌ [Instagram Webhook] Error processing event:", eventError);
          results.push({
            success: false,
            instagramUserId,
            error: eventError instanceof Error ? eventError.message : "Unknown error",
          });
        }
      }
    }

    console.log(`✅ [Instagram Webhook] Processed ${results.length} events`);

    return json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("❌ [Instagram Webhook] Processing failed:", error);

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
