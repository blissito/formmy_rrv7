/**
 * Google Calendar Integration Modal - Composio Version
 * Usa Composio SDK para OAuth y gestión de tokens automática
 */

import { useState, useEffect, useCallback } from "react";

type IntegrationStatus = "idle" | "loading" | "connected" | "error";

interface GoogleCalendarComposioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chatbotId: string; // ✅ Recibir chatbotId como prop
}

export default function GoogleCalendarComposioModal({
  isOpen,
  onClose,
  onSuccess,
  chatbotId, // ✅ Destructurar chatbotId
}: GoogleCalendarComposioModalProps) {
  const [status, setStatus] = useState<IntegrationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Verificar estado de conexión actual
  const checkConnectionStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`/api/v1/composio/google-calendar?intent=status&chatbotId=${chatbotId}`);
      const data = await response.json();

      if (data.isConnected) {
        setStatus("connected");
      } else {
        setStatus("idle");
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    } finally {
      setIsChecking(false);
    }
  }, [chatbotId]); // ✅ Agregar chatbotId a dependencies

  // Verificar estado al abrir el modal
  useEffect(() => {
    if (isOpen && chatbotId) {
      checkConnectionStatus();
    }
  }, [isOpen, chatbotId, checkConnectionStatus]);

  // Escuchar mensajes de la ventana de OAuth
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verificar origen por seguridad
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "composio_oauth_success") {
        // NO confiar solo en el mensaje, verificar estado real
        setStatus("loading");
        setError(null);

        // Polling con retry: Composio puede tardar unos segundos en procesar el OAuth
        const verifyConnection = async (retries = 5, delay = 1000): Promise<boolean> => {
          for (let i = 0; i < retries; i++) {
            try {
              const response = await fetch(`/api/v1/composio/google-calendar?intent=status&chatbotId=${chatbotId}`);
              const data = await response.json();

              if (data.isConnected) {
                return true;
              }

              // Esperar antes del siguiente intento
              if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            } catch (error) {
              console.error(`Intento ${i + 1} falló:`, error);
              if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
          return false;
        };

        try {
          const isConnected = await verifyConnection();

          if (isConnected) {
            setStatus("connected");
            onSuccess();

            // Cerrar modal después de 2 segundos
            setTimeout(() => {
              onClose();
            }, 2000);
          } else {
            setStatus("error");
            setError("La conexión no se completó después de varios intentos. Por favor intenta de nuevo o recarga la página.");
          }
        } catch (error) {
          setStatus("error");
          setError("Error verificando la conexión. Por favor recarga la página.");
          console.error("Error verificando estado después de OAuth:", error);
        }
      } else if (event.data.type === "composio_oauth_error") {
        setStatus("error");
        setError(event.data.description || "Error en la autorización");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onClose, chatbotId]);

  // Iniciar conexión de Google Calendar
  const handleConnect = async () => {
    setStatus("loading");
    setError(null);

    try {
      // ✅ Incluir chatbotId en la petición
      const response = await fetch(`/api/v1/composio/google-calendar?intent=connect&chatbotId=${chatbotId}`);

      if (!response.ok) {
        throw new Error("Error al iniciar conexión con Google Calendar");
      }

      const data = await response.json();

      if (!data.success || !data.authUrl) {
        throw new Error(data.error || "No se pudo generar URL de autorización");
      }

      // Abrir ventana de OAuth
      const popup = window.open(
        data.authUrl,
        "google-calendar-oauth",
        "width=600,height=700,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        throw new Error(
          "No se pudo abrir la ventana de autorización. Verifica que no esté bloqueada por el navegador."
        );
      }

      // Resetear estado después de abrir popup
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "Error desconocido");
    }
  };

  // Desconectar Google Calendar
  const handleDisconnect = async () => {
    setStatus("loading");
    setError(null);

    try {
      // ✅ Incluir chatbotId en la petición
      const response = await fetch(`/api/v1/composio/google-calendar?intent=disconnect&chatbotId=${chatbotId}`);

      if (!response.ok) {
        throw new Error("Error al desconectar Google Calendar");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "No se pudo desconectar");
      }

      setStatus("idle");
      onSuccess();
    } catch (error) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "Error desconocido");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 m-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/assets/chat/calendar.png" alt="Google Calendar" className="w-12 h-12" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Google Calendar</h2>
            <p className="text-sm text-gray-500">Gestiona eventos automáticamente</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Status message */}
          {isChecking && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span>Verificando conexión...</span>
            </div>
          )}

          {status === "connected" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Conectado</span>
              </div>
              <p className="text-sm text-green-700">
                Tu agente ahora puede crear, listar, actualizar y eliminar eventos en tu Google Calendar.
              </p>
            </div>
          )}

          {status === "error" && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Description */}
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">Qué puede hacer tu agente:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Crear eventos y citas automáticamente</li>
              <li>Consultar tu agenda y próximos eventos</li>
              <li>Actualizar fechas y detalles de eventos</li>
              <li>Eliminar eventos cuando sea necesario</li>
              <li>Agregar invitados y ubicaciones</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {status === "connected" ? (
              <>
                <button
                  onClick={handleDisconnect}
                  disabled={status === "loading"}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  {status === "loading" ? "Desconectando..." : "Desconectar"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleConnect}
                  disabled={status === "loading" || isChecking}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  {status === "loading" ? "Conectando..." : "Conectar Google Calendar"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Composio maneja la autorización y sincronización de tokens automáticamente.
            Tus credenciales están seguras y cifradas.
          </p>
        </div>
      </div>
    </div>
  );
}
