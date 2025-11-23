/**
 * WhatsApp Avatar Service
 *
 * Fetches profile pictures from WhatsApp contacts
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers
 */

import { db } from "~/utils/db.server";

interface AvatarResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Fetch avatar URL from WhatsApp API
 *
 * @param phoneNumber - Usuario de WhatsApp (ej: "521234567890")
 * @param accessToken - Token de acceso de la integración
 * @returns URL de la foto de perfil o null
 */
export async function fetchWhatsAppAvatar(
  phoneNumber: string,
  accessToken: string
): Promise<AvatarResult> {
  try {
    // WhatsApp Graph API endpoint para obtener profile picture
    const url = `https://graph.facebook.com/v18.0/${phoneNumber}/profile_picture`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Avatar] Error fetching avatar for ${phoneNumber}:`, response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    // La API retorna: { url: "https://..." }
    if (data.url) {
      console.log(`✅ [Avatar] Fetched avatar for ${phoneNumber}`);
      return {
        success: true,
        url: data.url,
      };
    } else {
      console.warn(`⚠️ [Avatar] No URL in response for ${phoneNumber}`);
      return {
        success: false,
        error: 'No URL in response',
      };
    }
  } catch (error) {
    console.error(`❌ [Avatar] Exception fetching avatar for ${phoneNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch y actualizar avatar de un contacto
 *
 * @param chatbotId - ID del chatbot
 * @param phoneNumber - Número de teléfono del contacto (sin formato)
 * @param accessToken - Token de acceso de WhatsApp
 */
export async function updateContactAvatar(
  chatbotId: string,
  phoneNumber: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Buscar contacto
    const contact = await db.contact.findFirst({
      where: {
        chatbotId,
        phone: phoneNumber,
      },
    });

    if (!contact) {
      console.warn(`⚠️ [Avatar] Contacto no encontrado: ${phoneNumber}`);
      return false;
    }

    // Si ya tiene profilePictureUrl, no volver a fetchear (optimización)
    if (contact.profilePictureUrl) {
      console.log(`⏭️ [Avatar] Contacto ${phoneNumber} ya tiene avatar`);
      return true;
    }

    // Fetch avatar
    const result = await fetchWhatsAppAvatar(phoneNumber, accessToken);

    if (result.success && result.url) {
      // Actualizar contacto con URL
      await db.contact.update({
        where: { id: contact.id },
        data: { profilePictureUrl: result.url },
      });

      console.log(`✅ [Avatar] Avatar actualizado para contacto ${phoneNumber}`);
      return true;
    } else {
      console.warn(`⚠️ [Avatar] No se pudo obtener avatar para ${phoneNumber}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [Avatar] Error actualizando avatar para ${phoneNumber}:`, error);
    return false;
  }
}
