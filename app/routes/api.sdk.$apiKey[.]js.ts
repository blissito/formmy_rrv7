import type { Route } from "./+types/api.sdk.$apiKey[.]js";
import { authenticateApiKey } from "server/chatbot/apiKeyAuth.server";
import { db } from "../utils/db.server";
import { readFileSync } from "fs";
import path from "path";
import { chatWidgetStyles, processStyles } from "../sdk/chat-widget-styles";

// Get the current directory in ES module


/**
 * Dynamic script generation endpoint for SDK
 * Generates personalized JavaScript SDK script based on API key
 * URL format: /api/sdk/{apiKey}.js
 */
export const loader = async ({ params }: Route.LoaderArgs) => {
  const { apiKey } = params;

  try {
    if (!apiKey) {
      return new Response("API key required", { status: 400 });
    }

    // Authenticate API key and get user data
    const authResult = await authenticateApiKey(apiKey);
    const { user } = authResult.apiKey;

    // Fetch user's chatbots (including inactive ones)
    const chatbots = await db.chatbot.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        welcomeMessage: true,
        primaryColor: true,
        theme: true,
        enableStreaming: true,
        streamingSpeed: true,
        personality: true,
        aiModel: true,
        status: true,
        isActive: true,
      },
    });

    // Use the specific chatbot by ID, or fallback to first available
    const requestedChatbot = chatbots.find(bot => bot.id === '687eced5cd352f36e1ff8214') || chatbots.find(bot => bot.isActive) || chatbots[0];

    if (!requestedChatbot) {
      return new Response("No chatbots found", { status: 404 });
    }

    // Generate the SDK script
    const sdkScript = generateSDKScript({
      apiKey,
      chatbot: requestedChatbot,
    });

    return new Response(sdkScript, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; connect-src 'self' http://localhost:*; style-src 'self' 'unsafe-inline';",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Content-Type-Options": "nosniff"
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("SDK script generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

/**
 * Generate the SDK script by reading from template file and replacing placeholders
 */
function generateSDKScript(config: { apiKey: string; chatbot: any }): string {
  const { apiKey, chatbot } = config;

  try {
    // Read the template file
    const templatePath = path.join(process.cwd(), "public/sdk/sdk-script.js");
    let template = readFileSync(templatePath, "utf-8");

    // Process styles with dynamic values
    const styles = processStyles(
      chatWidgetStyles,
      "{{PRIMARY_COLOR}}",
      "{{BOT_INITIAL}}"
    );
    const processedStyles: Record<string, string> = {};

    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === "string") {
        processedStyles[key] = value
          .replace(/\{\{PRIMARY_COLOR\}\}/g, chatbot.primaryColor || "#6366F1")
          .replace(
            /\{\{BOT_INITIAL\}\}/g,
            (chatbot.name?.charAt(0) || "C").toUpperCase()
          );
      }
    }

    // Reemplazar placeholders con valores reales
    return template
      .replace(/\{\{API_KEY\}\}/g, apiKey)
      .replace(/\{\{CHATBOT_NAME\}\}/g, chatbot.name || 'Chatbot')
      .replace(/\{\{CHATBOT_ID\}\}/g, chatbot.id || '')
      .replace(/\{\{CHATBOT_PRIMARY_COLOR\}\}/g, chatbot.primaryColor || '#6366F1')
      .replace(
        /\{\{CHATBOT_WELCOME_MESSAGE\}\}/g, 
        chatbot.welcomeMessage || '¡Hola! ¿En qué puedo ayudarte?'
      )
      
      .replace(/\{\{STYLES\.(\w+)\}\}/g, (_, styleKey) => {
        return processedStyles[styleKey] || "";
      });
  } catch (error) {
    console.error("Error generating SDK script:", error);
    return 'console.error("Failed to load chat widget. Please try again later.")';
  }
}
