/**
 * Gmail Integration Modal
 * Maneja la conexión OAuth2 de Gmail via Composio
 */

import { useState, useEffect } from "react";
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";
import type { Chatbot } from "@prisma/client";

interface GmailIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  chatbot: Chatbot;
}

export default function GmailIntegrationModal({
  isOpen,
  onClose,
  onSuccess,
  chatbot,
}: GmailIntegrationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Verificar si ya está conectado al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    async function checkStatus() {
      setIsCheckingStatus(true);
      try {
        const response = await fetch(
          `/api/v1/composio/gmail?intent=status&chatbotId=${chatbot.id}`,
          { method: 'GET', credentials: 'include' }
        );
        const data = await response.json();

        if (data.isConnected) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error verificando estado de Gmail:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    }

    checkStatus();
  }, [isOpen, chatbot.id]);

  const handleDisconnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const response = await fetch(
        `/api/v1/composio/gmail?intent=disconnect&chatbotId=${chatbot.id}`,
        { method: 'GET', credentials: 'include' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar Gmail');
      }

      setIsConnected(false);
      if (onSuccess) {
        onSuccess({ disconnected: true });
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Paso 1: Obtener la URL de autorización de OAuth
      const response = await fetch(
        `/api/v1/composio/gmail?intent=connect&chatbotId=${chatbot.id}`,
        { method: 'GET', credentials: 'include' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar OAuth');
      }

      // Paso 2: Abrir popup con la URL de OAuth
      const popup = window.open(
        data.authUrl,
        'gmail_oauth',
        'width=600,height=700,left=100,top=100'
      );

      if (!popup) {
        throw new Error('No se pudo abrir la ventana de autorización. Por favor permite popups para este sitio.');
      }

      // Paso 3: Escuchar por mensaje de éxito/error desde el popup
      const handleMessage = (event: MessageEvent) => {
        // Validar origen por seguridad
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'composio_oauth_success') {
          // Éxito!
          setIsConnecting(false);
          if (onSuccess) {
            onSuccess({ connected: true, provider: 'gmail' });
          }
          onClose();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'composio_oauth_error') {
          // Error
          setError(event.data.description || 'Error en la autorización');
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Limpiar listener si el popup se cierra manualmente
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      setIsConnecting(false);
    }
  };

  // No renderizar si el modal no está abierto
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title="Conectar Gmail" size="lg">
      <div className="space-y-6">
        {/* Loading state */}
        {isCheckingStatus && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">Verificando estado de conexión...</span>
            </div>
          </div>
        )}

        {/* Estado conectado */}
        {!isCheckingStatus && isConnected && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">Gmail Conectado</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Tu agente puede enviar y leer emails desde tu cuenta de Gmail.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header con logo (solo si no está conectado) */}
        {!isCheckingStatus && !isConnected && (
          <div className="flex items-center gap-4">
            <img
              src="/assets/chat/gmail.png"
              alt="Gmail"
              className="w-16 h-16"
            />
            <div>
              <h3 className="text-lg font-semibold">Conectar Gmail</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permite que tu agente envíe y lea correos electrónicos automáticamente
              </p>
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
            ¿Qué puede hacer tu agente?
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Enviar emails desde tu cuenta de Gmail automáticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Leer y buscar emails en tu bandeja de entrada</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Responder preguntas sobre tus correos recientes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Enviar mensajes con formato HTML y múltiples destinatarios</span>
            </li>
          </ul>
        </div>

        {/* Proceso de autorización */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Proceso de autorización:</h4>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">1.</span>
              <span>Se abrirá una ventana de Google para autorizar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">2.</span>
              <span>Selecciona la cuenta de Gmail que quieres conectar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">3.</span>
              <span>Autoriza el acceso a envío y lectura de emails</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">4.</span>
              <span>Serás redirigido automáticamente de vuelta aquí</span>
            </li>
          </ol>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Seguridad */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Conexión segura mediante OAuth2 de Google</span>
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Gestión automática de tokens</span>
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Puedes revocar el acceso en cualquier momento</span>
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 items-center -mr-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConnecting || isCheckingStatus}
            className="!max-w-none !w-auto !h-11 px-6 !flex !items-center !justify-center !mt-0 !mx-0"
          >
            {isConnected ? 'Cerrar' : 'Cancelar'}
          </Button>

          {/* Botón de Desconectar (solo si está conectado) */}
          {!isCheckingStatus && isConnected && (
            <Button
              onClick={handleDisconnect}
              disabled={isConnecting}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 px-6 !max-w-none !w-auto !h-11 !flex !items-center !justify-center !mt-0 !mx-0"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-red-700 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Desconectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Desconectar</span>
                </>
              )}
            </Button>
          )}

          {/* Botón de Conectar (solo si NO está conectado) */}
          {!isCheckingStatus && !isConnected && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 !max-w-none !w-auto !h-11 !flex !items-center !justify-center !mt-0 !mx-0"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Conectar con Google</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
