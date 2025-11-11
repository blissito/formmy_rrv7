import { useState, useEffect, useCallback } from "react";
import { FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface MessengerIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
  existingIntegration?: {
    id: string;
    pageId: string;
    pageAccessToken: string;
  } | null;
  onSuccess: (integration: any) => void;
}

type IntegrationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MessengerIntegrationModal({
  isOpen,
  onClose,
  chatbotId,
  existingIntegration,
  onSuccess,
}: MessengerIntegrationModalProps) {
  const [status, setStatus] = useState<IntegrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Marcar como cargado inmediatamente (no necesitamos FB SDK para este modal)
  useEffect(() => {
    if (isOpen) {
      setIsSDKLoaded(true);
    }
  }, [isOpen]);

  // Handler para iniciar el flujo de OAuth de Messenger
  const handleMessengerLogin = useCallback(() => {
    setStatus('loading');
    setError(null);

    try {
      // Abrir popup directo al flow OAuth (sin FB.login())
      const authUrl = `/dashboard/integrations/messenger/connect?chatbotId=${chatbotId}`;

      const width = 600;
      const height = 700;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      const oauthPopup = window.open(
        authUrl,
        'messenger-oauth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!oauthPopup) {
        setStatus('error');
        setError('Por favor permite popups para este sitio');
        return;
      }

      console.log('🚀 [Messenger Login] Popup abierto para OAuth flow...');

      // Escuchar mensajes del popup para detectar éxito/error
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'MESSENGER_AUTH_SUCCESS') {
          console.log('✅ [Messenger Login] Autenticación exitosa');
          setStatus('success');
          onSuccess({
            platform: 'MESSENGER',
            connected: true,
          });
          window.removeEventListener('message', messageHandler);
          oauthPopup.close();
        } else if (event.data.type === 'MESSENGER_AUTH_ERROR') {
          console.error('❌ [Messenger Login] Error:', event.data.error);
          setStatus('error');
          setError(event.data.error || 'Error al conectar Messenger');
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);

      // Detectar si el popup se cierra manualmente
      const checkPopupClosed = setInterval(() => {
        if (oauthPopup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);

          // Si el estado sigue en loading, el usuario cerró el popup manualmente
          if (status === 'loading') {
            setStatus('idle');
          }
        }
      }, 500);

    } catch (err) {
      console.error('❌ [Messenger Login] Error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error al abrir popup de autenticación');
    }
  }, [chatbotId, onSuccess, status]);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title="Facebook Messenger"
      size="lg"
    >
      <div className="space-y-6 mt-8">
        {/* Header simple */}
        <div className="text-center">
          <img
            src="/assets/chat/messenger.svg"
            alt="Messenger"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-dark mb-2">Conectar Messenger</h3>
          <p className="text-sm text-metal">
            Conecta tu página de Facebook para que tu chatbot responda mensajes automáticamente en Messenger
          </p>
        </div>

        {/* SDK Loading Status */}
        {!isSDKLoaded ? (
          <div className="flex items-center justify-center py-8">
            <FiLoader className="animate-spin h-6 w-6 text-blue-500 mr-2" />
            <span className="text-metal">Cargando Facebook SDK...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Messenger Login Button */}
            <button
              onClick={handleMessengerLogin}
              disabled={status === 'loading'}
              className="w-full px-6 py-3 text-white font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0084FF' }}
            >
              {status === 'loading' ? (
                <>
                  <FiLoader className="animate-spin h-5 w-5" />
                  Conectando...
                </>
              ) : (
                <>
                  <img src="/assets/chat/messenger.svg" alt="Messenger" className="w-5 h-5" />
                  Conectar con Facebook
                </>
              )}
            </button>

            {/* Success State */}
            {status === 'success' && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <FiCheck className="h-5 w-5" />
                <span className="font-medium">¡Messenger conectado exitosamente!</span>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                <FiAlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Error al conectar</p>
                  <p className="text-sm mt-1 whitespace-pre-line">{error}</p>
                </div>
              </div>
            )}

            {/* Info adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">¿Qué sucederá?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Se abrirá una ventana de Facebook para autorizar tu página</li>
                <li>Selecciona la página que quieres conectar</li>
                <li>Tu chatbot empezará a responder mensajes automáticamente</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
