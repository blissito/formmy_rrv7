import { shouldShowBranding } from "./planLimits.server";
import { db } from "~/utils/db.server";

/**
 * Configuración de branding para el widget de chat
 */
export interface BrandingConfig {
  showBranding: boolean;
  brandingText?: string;
  brandingLink?: string;
  brandingLogo?: string;
}

/**
 * Obtiene la configuración de branding para un chatbot según el plan del usuario
 */
export async function getChatbotBrandingConfig(
  userId: string
): Promise<BrandingConfig> {
  const showBranding = await shouldShowBranding(userId);

  if (showBranding) {
    return {
      showBranding: true,
      brandingText: "Powered by Formmy",
      brandingLink: "https://formmy.app",
      brandingLogo: "/images/formmy-logo-small.png",
    };
  } else {
    return {
      showBranding: false,
    };
  }
}

/**
 * Obtiene la configuración de branding para un chatbot por su ID
 */
export async function getChatbotBrandingConfigById(
  chatbotId: string
): Promise<BrandingConfig> {
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  return getChatbotBrandingConfig(chatbot.userId);
}
