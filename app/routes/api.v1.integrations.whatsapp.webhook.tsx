import { data as json } from "react-router";
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
import { isMessageProcessed } from "../../server/integrations/whatsapp/deduplication.service";
import { downloadWhatsAppSticker } from "../../server/integrations/whatsapp/media.service";
import { shouldProcessMessage } from "../../server/integrations/whatsapp/message-debounce.service";
import { updateContactAvatar } from "../../server/integrations/whatsapp/avatar.service";

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
        type: "text" | "image" | "document" | "audio" | "video" | "sticker";
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
        sticker?: {
          id: string;
          mime_type: string;
          sha256: string;
          animated: boolean;
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
 * DEPRECATED: Old in-memory deduplication (no funciona en múltiples instancias)
 * Ahora usamos MongoDB para deduplicación cross-instance
 */

/**
 * Loader function - handles GET requests for webhook verification
 * WhatsApp sends a GET request to verify the webhook endpoint - simplified
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    // Para embedded signup, verificamos contra tokens dinámicos guardados en BD

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
export const action = async ({ request }: Route.ActionArgs) => {
  try {
    // Parse the webhook payload
    const payload = await request.json() as WhatsAppWebhookPayload;

    // Process each entry in the webhook
    const results = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages" && change.value.messages) {
          // Process regular messages
          for (const message of change.value.messages) {
            try {
              // 🚀 DEBOUNCING: Verificar ventana de 5 segundos (previene duplicados rápidos)
              const shouldProcess = await shouldProcessMessage(
                message.id,
                change.value.metadata.phone_number_id,
                "message"
              );

              if (!shouldProcess) {
                results.push({
                  success: true,
                  messageId: message.id,
                  skipped: true,
                  reason: "debounced"
                });
                continue;
              }

              // ✅ DEDUPLICATION: Check MongoDB para cross-instance deduplication
              const alreadyProcessed = await isMessageProcessed(
                message.id,
                change.value.metadata.phone_number_id,
                "message"
              );

              if (alreadyProcessed) {
                results.push({
                  success: true,
                  messageId: message.id,
                  skipped: true,
                  reason: "duplicate"
                });
                continue;
              }

              // ✅ FILTER OLD MESSAGES: Meta best practice (skip messages >12 minutes old)
              const messageTimestamp = message.timestamp * 1000; // Convert to ms
              const ageMinutes = (Date.now() - messageTimestamp) / 1000 / 60;

              if (ageMinutes > 12) {
                console.warn(`⏱️ [Webhook] Skipping old message (${ageMinutes.toFixed(1)} min old):`, message.id);
                results.push({
                  success: true,
                  messageId: message.id,
                  skipped: true,
                  reason: "too_old"
                });
                continue;
              }

              // Extract contact name from webhook payload (if available)
              const contactName = change.value.contacts?.[0]?.profile?.name;

              const incomingMessage: IncomingMessage = {
                messageId: message.id,
                from: message.from,
                to: change.value.metadata.phone_number_id,
                type: message.type as any,
                body: message.text?.body || '',
                timestamp: message.timestamp,
                // Agregar sticker metadata si existe
                sticker: message.sticker ? {
                  id: message.sticker.id,
                  mimeType: message.sticker.mime_type,
                  animated: message.sticker.animated
                } : undefined
              };

              const result = await processIncomingMessage(incomingMessage, contactName, change.value.metadata.phone_number_id);
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
          // Process echo messages - save AND activate manual mode (auto-takeover)
          for (const echoMessage of (change.value as any).message_echoes) {
            try {
              // 🚀 DEBOUNCING: Verificar ventana de 5 segundos
              const shouldProcess = await shouldProcessMessage(
                echoMessage.id,
                change.value.metadata.phone_number_id,
                "echo"
              );

              if (!shouldProcess) {
                results.push({
                  success: true,
                  messageId: echoMessage.id,
                  type: 'echo',
                  skipped: true,
                  reason: "debounced"
                });
                continue;
              }

              // ✅ DEDUPLICATION: Check if echo already processed
              const alreadyProcessed = await isMessageProcessed(
                echoMessage.id,
                change.value.metadata.phone_number_id,
                "echo"
              );

              if (alreadyProcessed) {
                results.push({
                  success: true,
                  messageId: echoMessage.id,
                  type: 'echo',
                  skipped: true,
                  reason: "duplicate"
                });
                continue;
              }

              // Find integration and conversation for echo message
              const integration = await findIntegrationByPhoneNumber(
                change.value.metadata.phone_number_id
              );

              if (integration) {
                const conversation = await getOrCreateConversation(
                  echoMessage.to, // The customer who received the echo
                  integration.chatbotId
                );

                // 🎨 HANDLE STICKERS in echo messages
                let echoStickerUrl: string | undefined;
                if (echoMessage.type === "sticker" && echoMessage.sticker && integration.token) {
                  try {
                    console.log(`📎 [Echo Sticker] Downloading sticker ${echoMessage.sticker.id}...`);
                    const stickerResult = await downloadWhatsAppSticker(
                      echoMessage.sticker.id,
                      integration.token
                    );

                    if (stickerResult.success && stickerResult.url) {
                      echoStickerUrl = stickerResult.url;
                      console.log(`✅ [Echo Sticker] Downloaded successfully (${echoMessage.sticker.animated ? 'animated' : 'static'})`);
                    } else {
                      console.error(`❌ [Echo Sticker] Download failed: ${stickerResult.error}`);
                    }
                  } catch (stickerError) {
                    console.error(`❌ [Echo Sticker] Error downloading:`, stickerError);
                  }
                }

                // Save echo message using special channel to indicate echo
                await db.message.create({
                  data: {
                    conversationId: conversation.id,
                    content: echoMessage.type === "sticker" ? "📎 Sticker" : (echoMessage.text?.body || ''),
                    role: "ASSISTANT",
                    channel: "whatsapp_echo", // Special channel to indicate echo message
                    externalMessageId: echoMessage.id,
                    tokens: 0,
                    responseTime: 0,
                    picture: echoStickerUrl, // Save sticker URL
                  }
                });

                // 🔥 AUTO-TAKEOVER: Activar modo manual cuando el negocio responde desde su teléfono
                await db.conversation.update({
                  where: { id: conversation.id },
                  data: {
                    manualMode: true,
                    lastEchoAt: new Date(),
                  },
                });

                console.log(`✅ [Auto-Takeover] Activated manual mode for conversation ${conversation.id} (echo from business)`);

                results.push({
                  success: true,
                  messageId: echoMessage.id,
                  type: 'echo',
                  conversationId: conversation.id,
                  autoTakeover: true,
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
        } else if ((change.field as string) === "smb_app_state_sync" && change.value) {
          // Process state_sync webhook - contactos sincronizados desde WhatsApp Business App
          try {
            const syncData = change.value as any;
            const phoneNumberId = syncData.metadata?.phone_number_id || syncData.phone_number_id;

            // Puede contener: app_state (ONLINE/OFFLINE) O state_sync (contactos)
            const appState = syncData.app_state;
            const stateSyncArray = syncData.state_sync;

            // Find integration by phone number
            const integration = await findIntegrationByPhoneNumber(phoneNumberId);

            if (!integration) {
              console.warn(`⚠️ [State Sync] Integration not found for phone ${phoneNumberId}`);
              continue;
            }

            // Case 1: App State (ONLINE/OFFLINE)
            if (appState) {
              console.log(`📱 [App State] Phone ${phoneNumberId}: ${appState}`);

              await db.integration.update({
                where: { id: integration.id },
                data: {
                  metadata: {
                    ...(integration.metadata as any || {}),
                    appMobileActive: appState === "ONLINE",
                    lastAppStateSync: new Date().toISOString(),
                  },
                  lastActivity: new Date(),
                }
              });

              results.push({
                success: true,
                type: 'app_state',
                phoneNumberId,
                appState
              });
            }

            // Case 2: Contacts Sync
            if (stateSyncArray && Array.isArray(stateSyncArray)) {
              console.log(`📇 [Contacts Sync] Phone ${phoneNumberId}: ${stateSyncArray.length} contacts`);

              let addedCount = 0;
              let removedCount = 0;

              for (const syncItem of stateSyncArray) {
                if (syncItem.type === "contact") {
                  const action = syncItem.action; // "add" or "remove"
                  const contact = syncItem.contact;

                  if (action === "add") {
                    // Crear o actualizar contacto
                    try {
                      await db.contact.upsert({
                        where: {
                          chatbotId_phone: {
                            chatbotId: integration.chatbotId,
                            phone: contact.phone_number,
                          }
                        },
                        create: {
                          chatbotId: integration.chatbotId,
                          name: contact.full_name || contact.first_name || null,
                          phone: contact.phone_number,
                          source: "whatsapp",
                          status: "NEW",
                        },
                        update: {
                          name: contact.full_name || contact.first_name || null,
                          source: "whatsapp",
                        },
                      });
                      addedCount++;
                    } catch (err) {
                      console.error(`❌ [Contacts Sync] Error upserting contact ${contact.phone_number}:`, err);
                    }
                  } else if (action === "remove") {
                    // Eliminar contacto (opcional - podrías marcar como inactivo en lugar de eliminar)
                    try {
                      await db.contact.deleteMany({
                        where: {
                          chatbotId: integration.chatbotId,
                          phone: contact.phone_number,
                        },
                      });
                      removedCount++;
                    } catch (err) {
                      console.error(`❌ [Contacts Sync] Error deleting contact ${contact.phone_number}:`, err);
                    }
                  }
                }
              }

              console.log(`✅ [Contacts Sync] Processed ${addedCount} added, ${removedCount} removed`);

              results.push({
                success: true,
                type: 'contacts_sync',
                phoneNumberId,
                added: addedCount,
                removed: removedCount,
              });
            }
          } catch (error) {
            console.error("Error processing smb_app_state_sync:", error);
            results.push({
              success: false,
              type: 'state_sync',
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        } else if ((change.field as string) === "history" && change.value) {
          // Process history sync webhook - historical conversations from WhatsApp Business App
          try {
            const historyData = change.value as any;

            // 🐛 DEBUG: Log the ENTIRE payload to see what Meta actually sends
            console.log(`[History Sync RAW PAYLOAD] ${JSON.stringify(historyData, null, 2)}`);

            // ✅ CORRECTO: Estructura real de History Sync
            const phoneNumberId = historyData.metadata?.phone_number_id;
            const historyArray = historyData.history || [];

            if (!phoneNumberId) {
              console.warn(`⚠️ [History Sync] No phone_number_id found in metadata`);
              continue;
            }

            // Find integration by phone number
            const integration = await findIntegrationByPhoneNumber(phoneNumberId);

            if (!integration) {
              console.warn(`⚠️ [History Sync] Integration not found for phone ${phoneNumberId}`);
              results.push({
                success: false,
                type: 'history',
                phoneNumberId,
                error: 'Integration not found'
              });
              continue;
            }

            // Process each historical message
            let processedCount = 0;
            let skippedCount = 0;
            let totalProgress = 0;
            let totalPhase = "unknown";

            // ✅ Iterar sobre history array
            for (const historyItem of historyArray) {
              const metadata = historyItem.metadata || {};
              const progress = metadata.progress || 0;
              const phase = metadata.phase || "unknown";
              const threads = historyItem.threads || [];

              totalProgress = Math.max(totalProgress, progress);
              totalPhase = phase;

              console.log(`📜 [History Sync] Processing chunk (phase: ${phase}, progress: ${progress}%, threads: ${threads.length})`);

              // ✅ Iterar sobre threads (conversaciones)
              for (const thread of threads) {
                const threadId = thread.id; // ID del contacto
                const messages = thread.messages || [];

                console.log(`💬 [History Sync] Thread ${threadId}: ${messages.length} messages`);

                // Optimización: crear conversación una sola vez por thread (no por cada mensaje)
                let conversationForThread = null;

                // ✅ Iterar sobre mensajes del thread
                for (const msg of messages) {
                  try {
                    // 🐛 DEBUG: Log message type to understand what Meta sends
                    console.log(`[History Sync Debug] Message type: "${msg.type}", from: ${msg.from}, thread: ${threadId}`);

                    // ✅ CORRECTO: Usar history_context.from_me para determinar dirección
                    const isFromBusiness = msg.history_context?.from_me === true;
                    const customerPhone = threadId; // El thread ID es el número del contacto

                    // Skip non-text messages for now
                    if (msg.type !== "text") {
                      console.log(`[History Sync Debug] ⚠️ Skipping non-text message type: "${msg.type}"`);
                      skippedCount++;
                      continue;
                    }

                    // Create or get conversation (solo la primera vez que encontramos un mensaje válido)
                    if (!conversationForThread) {
                      conversationForThread = await getOrCreateConversation(
                        customerPhone,
                        integration.chatbotId
                      );
                    }

                    const conversation = conversationForThread;

                    // Save message (upsert to prevent duplicates)
                    await db.message.upsert({
                      where: {
                        conversationId_externalMessageId: {
                          conversationId: conversation.id,
                          externalMessageId: msg.id,
                        }
                      },
                      create: {
                        conversationId: conversation.id,
                        content: msg.text?.body || '',
                        role: isFromBusiness ? "ASSISTANT" : "USER",
                        channel: "whatsapp_history",
                        externalMessageId: msg.id,
                        tokens: 0,
                        responseTime: 0,
                        createdAt: new Date(parseInt(msg.timestamp) * 1000), // Convert Unix timestamp
                      },
                      update: {
                        // No actualizar si ya existe (mensajes históricos son inmutables)
                      }
                    });

                    processedCount++;
                  } catch (msgError) {
                    console.error(`❌ [History Sync] Error processing message ${msg.id}:`, msgError);
                    skippedCount++;
                  }
                }
              }
            }

            // Update integration metadata with sync progress
            const now = new Date();
            const lastSyncAt = integration.metadata && (integration.metadata as any).lastHistorySyncAt
              ? new Date((integration.metadata as any).lastHistorySyncAt)
              : null;

            // ✅ PRAGMATIC FIX: Si han pasado 60+ segundos desde el último webhook Y ya recibimos algunos,
            // marcar como completado (Meta no siempre envía progress:100 en cuentas con poco historial)
            const timeSinceLastSync = lastSyncAt ? (now.getTime() - lastSyncAt.getTime()) / 1000 : 0;
            const shouldComplete = totalProgress === 100 || (timeSinceLastSync > 60 && lastSyncAt !== null);

            await db.integration.update({
              where: { id: integration.id },
              data: {
                metadata: {
                  ...(integration.metadata as any || {}),
                  lastHistorySyncProgress: totalProgress,
                  lastHistorySyncPhase: totalPhase,
                  lastHistorySyncAt: now.toISOString(),
                },
                syncStatus: shouldComplete ? "completed" : "syncing",
                syncCompletedAt: shouldComplete ? now : undefined,
              }
            });

            const totalMessages = processedCount + skippedCount;
            console.log(`✅ [History Sync] Processed ${processedCount}/${totalMessages} messages (skipped: ${skippedCount})`);

            if (shouldComplete) {
              console.log(`🎉 [History Sync] Sync completed for integration ${integration.id} (progress: ${totalProgress}%, time since last: ${timeSinceLastSync.toFixed(0)}s)`);
            }

            results.push({
              success: true,
              type: 'history',
              phoneNumberId,
              progress: totalProgress,
              phase: totalPhase,
              processed: processedCount,
              skipped: skippedCount,
            });
          } catch (error) {
            console.error("Error processing history sync:", error);
            results.push({
              success: false,
              type: 'history',
              error: error instanceof Error ? error.message : "Unknown error"
            });
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
async function processIncomingMessage(message: IncomingMessage, contactName?: string, phoneNumberId?: string) {

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

    // ✅ CREATE/UPDATE CONTACT: Save contact info from WhatsApp when message arrives
    if (contactName) {
      try {
        const normalizedPhone = message.from.replace(/\D/g, "").slice(-10);

        await db.contact.upsert({
          where: {
            chatbotId_phone: {
              chatbotId: integration.chatbotId,
              phone: normalizedPhone,
            }
          },
          create: {
            chatbotId: integration.chatbotId,
            name: contactName,
            phone: normalizedPhone,
            source: "WHATSAPP",
            status: "NEW",
          },
          update: {
            name: contactName,
            lastUpdated: new Date(),
          },
        });

        console.log(`✅ Contact saved: ${contactName} (${normalizedPhone})`);

        // 📸 FETCH AVATAR: Obtener foto de perfil de WhatsApp (async, no bloqueante)
        if (integration.token) {
          updateContactAvatar(
            integration.chatbotId,
            normalizedPhone,
            integration.token
          ).catch((err) => {
            console.error("⚠️ Failed to fetch avatar (non-blocking):", err);
          });
        }
      } catch (contactError) {
        console.error("⚠️ Failed to save contact, continuing:", contactError);
        // Don't fail the message processing if contact save fails
      }
    }

    // Create or find conversation
    const conversation = await getOrCreateConversation(
      message.from,
      integration.chatbotId
    );

    // 🎨 HANDLE STICKERS: Download and save sticker media
    let stickerUrl: string | undefined;
    if (message.type === "sticker" && message.sticker && integration.token) {
      try {
        console.log(`📎 [Sticker] Downloading sticker ${message.sticker.id}...`);
        const stickerResult = await downloadWhatsAppSticker(
          message.sticker.id,
          integration.token
        );

        if (stickerResult.success && stickerResult.url) {
          stickerUrl = stickerResult.url;
          console.log(`✅ [Sticker] Downloaded successfully (${message.sticker.animated ? 'animated' : 'static'})`);
        } else {
          console.error(`❌ [Sticker] Download failed: ${stickerResult.error}`);
        }
      } catch (stickerError) {
        console.error(`❌ [Sticker] Error downloading:`, stickerError);
        // Continue processing even if sticker download fails
      }
    }

    // Save the incoming message first
    const userMessage = await addWhatsAppUserMessage(
      conversation.id,
      message.type === "sticker" ? "📎 Sticker" : message.body,
      message.messageId,
      stickerUrl // Pass sticker URL to save in picture field
    );

    // Check if conversation is in manual mode
    if (conversation.manualMode) {

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
      take: 20, // Unificado a 20 mensajes (window estándar)
      select: {
        role: true,
        content: true,
        createdAt: true,
        channel: true // ✅ Incluir channel para detectar mensajes echo
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
    const chatHistory = conversationHistory?.slice(-20).map(msg => {
      const role = (msg.role === "USER" ? "user" : "assistant") as any;
      let content = msg.content;

      // 📱 Marcar mensajes echo (respuestas manuales del negocio)
      if (role === "assistant" && (msg as any).channel === "whatsapp_echo") {
        content = `📱 [Respuesta manual del negocio]: ${content}`;
      }

      return { role, content };
    }) || [];

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
