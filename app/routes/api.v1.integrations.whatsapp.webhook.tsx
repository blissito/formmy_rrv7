import { data as json } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { IntegrationType } from "@prisma/client";
import {
  type IncomingMessage,
} from "../../server/integrations/whatsapp/types";
import {
  addWhatsAppUserMessage,
  addWhatsAppAssistantMessage,
} from "../../server/chatbot/messageModel.server";
import { getOrCreateConversation } from "../../server/integrations/whatsapp/conversation.server";
import { getChatbotById } from "../../server/chatbot/chatbotModel.server";
import { db } from "../utils/db.server";
import { createAgent } from "../../server/agent-engine-v0";
import { agentStreamEvent } from "@llamaindex/workflow";

// Types for WhatsApp webhook payload
interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: "whatsapp";
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        text?: {
          body: string;
        };
        type: "text" | "image" | "document" | "audio" | "video";
        image?: {
          id: string;
          mime_type: string;
          sha256: string;
          caption?: string;
        };
        document?: {
          id: string;
          filename: string;
          mime_type: string;
          sha256: string;
          caption?: string;
        };
        audio?: {
          id: string;
          mime_type: string;
          sha256: string;
        };
        video?: {
          id: string;
          mime_type: string;
          sha256: string;
          caption?: string;
        };
      }>;
      statuses?: Array<{
        id: string;
        status: "sent" | "delivered" | "read" | "failed";
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: "messages";
  }>;
}

interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: WhatsAppWebhookEntry[];
}

/**
 * Deduplication cache for webhook messages (in-memory)
 * WhatsApp may send the same webhook multiple times if we don't respond fast enough
 */
const processedMessages = new Set<string>();
const MESSAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up old entries periodically
setInterval(() => {
  processedMessages.clear();
}, MESSAGE_CACHE_TTL);

/**
 * Loader function - handles GET requests for webhook verification
 * WhatsApp sends a GET request to verify the webhook endpoint - simplified
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    // Para embedded signup, verificamos contra tokens dinámicos guardados en BD
    console.log("Webhook verification request", {
      mode,
      token: token ? '***' : 'missing',
      challenge: challenge ? 'present' : 'missing',
    });

    // Verify that this is a webhook verification request
    if (mode !== "subscribe") {
      console.warn(`Invalid mode: ${mode}. Expected 'subscribe'`);
      return new Response("Invalid mode", { status: 400 });
    }

    // Verificar token contra integraciones existentes o variable de entorno para testing
    let isValidToken = false;

    // 1. Verificar contra variable de entorno (para testing manual)
    const envToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (envToken && token === envToken) {
      isValidToken = true;
    }

    // 2. Verificar contra tokens dinámicos de embedded signup
    if (!isValidToken && token) {
      const integration = await db.integration.findFirst({
        where: {
          platform: "WHATSAPP",
          webhookVerifyToken: token
        }
      });

      if (integration) {
        isValidToken = true;
        console.log("Token verified against dynamic webhook token from Integration");
      }
    }

    if (!isValidToken) {
      console.warn("Token verification failed");
      return new Response("Forbidden", { status: 403 });
    }

    if (!challenge) {
      console.warn("No challenge provided");
      return new Response("No challenge provided", { status: 400 });
    }

    console.log("Webhook verification successful");
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });

  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Verification failed", { status: 500 });
  }
};

/**
 * Action function - handles POST requests for incoming webhooks
 * Processes incoming WhatsApp messages and generates chatbot responses - simplified
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Parse the webhook payload
    const payload = await request.json() as WhatsAppWebhookPayload;
    console.log("Received webhook payload", {
      object: payload.object,
      entryCount: payload.entry?.length
    });

    // Process each entry in the webhook
    const results = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages" && change.value.messages) {
          // Process regular messages
          for (const message of change.value.messages) {
            try {
              // ✅ DEDUPLICATION: Skip if already processed
              if (processedMessages.has(message.id)) {
                console.log("⏭️  Skipping duplicate message", { messageId: message.id });
                results.push({
                  success: true,
                  messageId: message.id,
                  skipped: true,
                  reason: "duplicate"
                });
                continue;
              }

              // Mark as processed BEFORE processing (prevent race conditions)
              processedMessages.add(message.id);

              const incomingMessage: IncomingMessage = {
                messageId: message.id,
                from: message.from,
                to: change.value.metadata.phone_number_id,
                type: message.type as any,
                body: message.text?.body || '',
                timestamp: message.timestamp
              };

              const result = await processIncomingMessage(incomingMessage);
              results.push(result);
            } catch (error) {
              console.error("Error processing individual message:", error);
              results.push({
                success: false,
                messageId: message.id,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
        } else if ((change.field as string) === "smb_message_echoes" && (change.value as any).message_echoes) {
          // Process echo messages - save but don't respond
          for (const echoMessage of (change.value as any).message_echoes) {
            try {
              console.log("Processing echo message", {
                messageId: echoMessage.id,
                from: echoMessage.from,
                to: echoMessage.to
              });

              // Find integration and conversation for echo message
              const integration = await findIntegrationByPhoneNumber(
                change.value.metadata.phone_number_id
              );

              if (integration) {
                const conversation = await getOrCreateConversation(
                  echoMessage.to, // The customer who received the echo
                  integration.chatbotId
                );

                // Save echo message using special channel to indicate echo
                await db.message.create({
                  data: {
                    conversationId: conversation.id,
                    content: echoMessage.text?.body || '',
                    role: "ASSISTANT",
                    channel: "whatsapp_echo", // Special channel to indicate echo message
                    externalMessageId: echoMessage.id,
                    tokens: 0,
                    responseTime: 0,
                  }
                });

                results.push({
                  success: true,
                  messageId: echoMessage.id,
                  type: 'echo',
                  conversationId: conversation.id
                });
              }
            } catch (error) {
              console.error("Error processing echo message:", error);
              results.push({
                success: false,
                messageId: echoMessage.id,
                type: 'echo',
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
        }
      }
    }

    return json({
      success: true,
      processed: results.length,
      results,
    });

  } catch (error) {
    console.error("Webhook processing failed:", error);

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

/**
 * Process an incoming WhatsApp message - simplified direct approach
 */
async function processIncomingMessage(message: IncomingMessage) {
  console.log("Processing incoming message", {
    messageId: message.messageId,
    from: message.from,
    type: message.type,
  });

  try {
    // Find the integration for this phone number
    const integration = await findIntegrationByPhoneNumber(message.to);

    if (!integration || !integration.isActive) {
      console.warn("Integration not found or not active", {
        phoneNumberId: message.to,
        integration: integration?.id
      });
      throw new Error("Integration is not active");
    }

    // Get the chatbot
    const chatbot = await getChatbotById(integration.chatbotId);

    if (!chatbot) {
      console.error("Chatbot not found", { chatbotId: integration.chatbotId });
      throw new Error("Chatbot not found");
    }

    // Create or find conversation
    const conversation = await getOrCreateConversation(
      message.from,
      integration.chatbotId
    );

    // Save the incoming message first
    const userMessage = await addWhatsAppUserMessage(
      conversation.id,
      message.body,
      message.messageId
    );

    // Check if conversation is in manual mode
    if (conversation.manualMode) {
      console.log("Conversation is in manual mode - skipping automatic response", {
        conversationId: conversation.id,
        messageId: message.messageId
      });

      return {
        success: true,
        messageId: message.messageId,
        conversationId: conversation.id,
        userMessageId: userMessage.id,
        mode: "manual",
        note: "Message saved but no automatic response generated (manual mode)"
      };
    }

    // Get recent conversation history for context (only if not in manual mode)
    const recentMessages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        role: true,
        content: true,
        createdAt: true
      }
    });

    // Generate chatbot response with history context
    const botResponse = await generateChatbotResponse(
      message.body,
      chatbot,
      conversation.id,
      recentMessages.reverse() // Oldest first for context
    );

    // Save the bot response
    const assistantMessage = await addWhatsAppAssistantMessage(
      conversation.id,
      botResponse.content,
      undefined, // WhatsApp message ID will be set when sent
      botResponse.tokens,
      botResponse.responseTime
    );

    // Send response back to WhatsApp using simplified HTTP call
    const messageResponse = await sendWhatsAppMessage(
      message.from,
      botResponse.content,
      integration
    );

    // Update the assistant message with the WhatsApp message ID
    if (messageResponse.messageId) {
      try {
        await db.message.update({
          where: { id: assistantMessage.id },
          data: { externalMessageId: messageResponse.messageId },
        });
      } catch (error) {
        console.warn("Failed to update message with WhatsApp ID:", error);
      }
    }

    console.log("Message processed successfully", {
      messageId: message.messageId,
      conversationId: conversation.id,
      responseMessageId: messageResponse.messageId,
    });

    return {
      success: true,
      messageId: message.messageId,
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      whatsappMessageId: messageResponse.messageId,
    };

  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    throw error;
  }
}

/**
 * Find integration by phone number ID - simplified
 */
async function findIntegrationByPhoneNumber(phoneNumberId: string) {
  return await db.integration.findFirst({
    where: {
      platform: IntegrationType.WHATSAPP,
      phoneNumberId,
      isActive: true,
    },
  });
}

/**
 * Send WhatsApp message using direct HTTP call
 */
async function sendWhatsAppMessage(
  to: string,
  text: string,
  integration: any
) {
  const url = `https://graph.facebook.com/v18.0/${integration.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    text: {
      body: text.substring(0, 4096) // WhatsApp has 4096 character limit
    }
  };

  console.log(`Sending WhatsApp message to ${to}: "${text.substring(0, 100)}..."`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${integration.token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WhatsApp API error:', response.status, errorText);
    throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('WhatsApp message sent successfully:', result);

  return {
    messageId: result.messages?.[0]?.id,
    success: true
  };
}

// Removed unused Effect functions - now using simplified direct functions above

/**
 * Generate chatbot response using AgentEngine V0
 */
async function generateChatbotResponse(
  userMessage: string,
  chatbot: any,
  conversationId: string,
  conversationHistory?: any[]
) {
  const startTime = Date.now();

  console.log("Generating chatbot response", {
    userMessage: userMessage.substring(0, 100),
    chatbotId: chatbot.id,
    conversationId,
  });

  try {
    // Get user info from chatbot owner
    const user = await db.user.findUnique({
      where: { id: chatbot.userId }
    });

    if (!user) {
      throw new Error("User not found for chatbot");
    }

    // Create agent with V0 engine
    const agent = await createAgent(chatbot, user);

    // Build conversation history from recent messages
    const chatHistory = conversationHistory?.slice(-10).map(msg => ({
      role: (msg.role === "USER" ? "user" : "assistant") as any,
      content: msg.content
    })) || [];

    // Generate response using agent - use direct method to avoid streaming complexity
    let responseContent = '';
    try {
      const responseStream = agent.runStream(userMessage, { chatHistory }) as any;

      for await (const event of responseStream) {
        if (agentStreamEvent.include(event)) {
          responseContent += event.data.delta || '';
        }
      }
    } catch (streamError) {
      console.error("Streaming error, falling back to simple response:", streamError);
      responseContent = `Hola! Soy ${chatbot.name}. Recibí tu mensaje: "${userMessage}". El sistema de IA completo se está configurando, mientras tanto puedo ayudarte con consultas básicas.`;
    }

    const responseTime = Date.now() - startTime;

    console.log("Chatbot response generated", {
      responseLength: responseContent.length,
      responseTime,
    });

    return {
      content: responseContent.trim() || "Lo siento, no pude generar una respuesta. Intenta de nuevo.",
      tokens: Math.ceil(responseContent.length / 4), // Estimated tokens
      responseTime,
    };

  } catch (error) {
    console.error("Error generating chatbot response:", error);

    return {
      content: "Lo siento, estoy teniendo problemas para procesar tu mensaje. Por favor intenta de nuevo.",
      tokens: 20,
      responseTime: Date.now() - startTime,
    };
  }
}

// WhatsApp webhook endpoint - simplified implementation with AgentEngine V0
// Handles both regular messages and echo messages from coexistence mode
