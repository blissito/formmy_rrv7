/**
 * Servicio para descargar y almacenar media de WhatsApp
 * (stickers, imágenes, videos, documentos)
 */

const WHATSAPP_API_VERSION = "v18.0";

interface MediaDownloadResult {
  success: boolean;
  url?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Descarga un sticker/media desde WhatsApp Media API
 *
 * Flujo:
 * 1. GET media metadata (obtiene URL temporal)
 * 2. GET media file (descarga el archivo)
 * 3. Upload a S3 (almacenamiento permanente)
 *
 * @param mediaId - ID del media desde WhatsApp
 * @param accessToken - Token de acceso de la integración
 */
export async function downloadWhatsAppMedia(
  mediaId: string,
  accessToken: string
): Promise<MediaDownloadResult> {
  try {
    // Step 1: Get media URL
    const metadataUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${mediaId}`;

    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!metadataResponse.ok) {
      const error = await metadataResponse.text();
      console.error(`[WhatsApp Media] Failed to get metadata: ${error}`);
      return {
        success: false,
        error: `Failed to get media metadata: ${metadataResponse.status}`,
      };
    }

    const metadata = await metadataResponse.json();
    const { url: mediaUrl, mime_type: mimeType } = metadata;

    // Step 2: Download media file
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mediaResponse.ok) {
      const error = await mediaResponse.text();
      console.error(`[WhatsApp Media] Failed to download: ${error}`);
      return {
        success: false,
        error: `Failed to download media: ${mediaResponse.status}`,
      };
    }

    // Step 3: Get media as base64 (para almacenar en DB o subir a S3)
    const mediaBuffer = await mediaResponse.arrayBuffer();
    const base64Media = Buffer.from(mediaBuffer).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Media}`;

    console.log(
      `✅ [WhatsApp Media] Downloaded ${mediaId} (${mimeType}, ${(mediaBuffer.byteLength / 1024).toFixed(2)} KB)`
    );

    return {
      success: true,
      url: dataUrl, // Data URL para almacenar directamente
      mimeType,
    };
  } catch (error) {
    console.error(`[WhatsApp Media] Error downloading ${mediaId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Descarga un sticker específicamente
 */
export async function downloadWhatsAppSticker(
  stickerId: string,
  accessToken: string
): Promise<MediaDownloadResult> {
  return downloadWhatsAppMedia(stickerId, accessToken);
}
