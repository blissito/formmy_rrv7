/**
 * Hook para obtener la integración de WhatsApp de un chatbot
 */

import { useEffect, useState } from "react";

interface WhatsAppIntegration {
  id: string;
  platform: string;
}

export function useWhatsAppIntegration(chatbotId: string) {
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatbotId) return;

    const fetchIntegration = async () => {
      try {
        const response = await fetch(`/api/v1/integration?chatbotId=${chatbotId}`);

        if (!response.ok) {
          setIntegration(null);
          return;
        }

        const data = await response.json();

        // El endpoint retorna { integrations: [...] }
        const whatsappIntegration = data.integrations?.find(
          (int: any) => int.platform === "WHATSAPP"
        );

        setIntegration(whatsappIntegration || null);
      } catch (error) {
        console.error("[useWhatsAppIntegration] Error:", error);
        setIntegration(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegration();
  }, [chatbotId]);

  return { integration, isLoading };
}
