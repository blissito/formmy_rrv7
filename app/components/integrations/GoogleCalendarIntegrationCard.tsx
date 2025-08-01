import React, { useState, useEffect, useCallback } from "react";

type IntegrationStatus = "idle" | "loading" | "success" | "error";

interface GoogleCalendarIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  chatbotId: string;
  existingIntegration?: {
    id: string;
    calendarId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } | null;
  onSuccess: (integration: any) => void;
}

export default function GoogleCalendarIntegrationModal({
  isOpen,
  onClose,
  onConnect,
  chatbotId,
  existingIntegration,
  onSuccess,
}: GoogleCalendarIntegrationModalProps) {
  const [status, setStatus] = useState<IntegrationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  console.log("🔍 GoogleCalendarIntegrationModal rendered with props:", {
    isOpen,
    chatbotId,
    existingIntegration,
  });

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "oauth_success") {
        setStatus("success");
        onSuccess(event.data.integration);
        onClose();
      } else if (event.data.type === "oauth_error") {
        setStatus("error");
        setError(event.data.description || "Error en la autorización");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onClose]);

  const handleOAuthConnect = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      // Use default configuration for Google Calendar
      const defaultConfig = {
        calendarId: "primary",
        clientId: "YOUR_GOOGLE_CLIENT_ID", // This should come from environment or config
        clientSecret: "YOUR_GOOGLE_CLIENT_SECRET", // This should come from environment or config
        redirectUri: `${window.location.origin}/api/v1/oauth2/google/calendar/callback`,
      };

      // First create the integration with the configuration
      const response = await fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "create",
          chatbotId,
          platform: "GOOGLE_CALENDAR",
          calendarId: defaultConfig.calendarId,
          clientId: defaultConfig.clientId,
          clientSecret: defaultConfig.clientSecret,
          redirectUri: defaultConfig.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear la integración");
      }

      const data = await response.json();
      const integrationId = data.integration.id;

      // Create OAuth URL with state containing integration data
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", defaultConfig.clientId);
      authUrl.searchParams.append("redirect_uri", defaultConfig.redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append(
        "scope",
        "https://www.googleapis.com/auth/calendar"
      );
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      // Include integration data in state
      const state = encodeURIComponent(
        JSON.stringify({
          integrationId,
          clientId: defaultConfig.clientId,
          clientSecret: defaultConfig.clientSecret,
          redirectUri: defaultConfig.redirectUri,
        })
      );
      authUrl.searchParams.append("state", state);

      // Open OAuth popup
      const popup = window.open(
        authUrl.toString(),
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        throw new Error(
          "No se pudo abrir la ventana de autorización. Verifica que no esté bloqueada por el navegador."
        );
      }

      // Reset status after opening popup
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "Error desconocido");
    }
  }, [chatbotId]);

  // Auto-trigger OAuth when component opens (no modal, direct popup)
  useEffect(() => {
    console.log("🔍 GoogleCalendarIntegrationModal useEffect triggered:", {
      isOpen,
      existingIntegration,
    });
    if (isOpen && !existingIntegration) {
      console.log("🚀 Triggering OAuth for Google Calendar");
      handleOAuthConnect();
    }
  }, [isOpen, existingIntegration, handleOAuthConnect]);

  // Return null since we don't show any modal, just trigger the popup
  if (error) {
    console.error("Google Calendar OAuth Error:", error);
  }

  return null;
}
