import { useState, useEffect, useRef, useCallback } from "react";
import { FiX, FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface WhatsAppCoexistenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
  existingIntegration?: {
    id: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken?: string;
  } | null;
  onSuccess: (integration: any) => void;
}

type IntegrationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function WhatsAppCoexistenceModal({
  isOpen,
  onClose,
  chatbotId,
  existingIntegration,
  onSuccess,
}: WhatsAppCoexistenceModalProps) {
  const [status, setStatus] = useState<IntegrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const embeddedSignupContainerRef = useRef<HTMLDivElement>(null);

  // Cargar el SDK de Facebook
  useEffect(() => {
    if (!isOpen) return;

    // Si ya está cargado, no volver a cargar
    if (window.FB) {
      setIsSDKLoaded(true);
      return;
    }

    // Cargar script del SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0'
      });
      setIsSDKLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup si es necesario
    };
  }, [isOpen]);

  // Inicializar el Embedded Signup cuando el SDK esté listo
  useEffect(() => {
    if (!isSDKLoaded || !isOpen || !embeddedSignupContainerRef.current) return;

    try {
      // Limpiar el contenedor antes de renderizar
      if (embeddedSignupContainerRef.current) {
        embeddedSignupContainerRef.current.innerHTML = '';
      }

      // Renderizar el componente de Embedded Signup
      window.FB.XFBML.parse(embeddedSignupContainerRef.current);

      // Listener para cuando se completa el login
      window.FB.Event.subscribe('auth.authResponseChange', handleSignupComplete);
      window.FB.Event.subscribe('auth.statusChange', handleSignupComplete);

    } catch (err) {
      console.error('Error initializing Embedded Signup:', err);
      setError('Error al inicializar el proceso de conexión con WhatsApp');
    }
  }, [isSDKLoaded, isOpen]);

  // Manejar la respuesta del login con Facebook
  const handleSignupComplete = useCallback(async (response: any) => {
    console.log('Facebook auth response:', response);

    if (!response.authResponse || response.status !== 'connected') {
      return; // Solo procesar si está conectado
    }

    setStatus('loading');
    setError(null);

    try {
      // Intercambiar el code por un access token permanente
      const exchangeResponse = await fetch('/api/v1/integrations/whatsapp/embedded-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          code: response.authResponse.code,
          accessToken: response.authResponse.accessToken,
          userID: response.authResponse.userID,
        }),
      });

      const data = await exchangeResponse.json();

      if (!exchangeResponse.ok) {
        throw new Error(data.message || 'Error al procesar la autorización');
      }

      setStatus('success');
      onSuccess(data);

      // Cerrar el modal después de un breve retraso para mostrar el éxito
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar la conexión');
    }
  }, [chatbotId, onSuccess, onClose]);

  // Reset cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title="Conectar WhatsApp Business (Coexistence Mode)"
      size="lg"
    >
      <div className="space-y-6 mt-8">
        {/* Header con información */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/assets/chat/whatsapp.svg"
              alt="WhatsApp"
              className="w-8 h-8"
            />
            <div>
              <h3 className="font-medium text-dark">WhatsApp Business Cloud API</h3>
              <p className="text-sm text-metal">
                Conecta tu chatbot con la API oficial de WhatsApp Business
              </p>
            </div>
          </div>
        </div>

        {/* Información sobre Cloud API */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">✨ Ventajas de Cloud API</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Usa la API oficial de WhatsApp Business</li>
            <li>• Sin límites de mensajes por segundo</li>
            <li>• Soporte para múltiples usuarios administradores</li>
            <li>• Webhooks en tiempo real para mensajes entrantes</li>
          </ul>
        </div>

        {/* Contenedor para el Embedded Signup */}
        {!isSDKLoaded ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-2 text-metal">Cargando componente de Meta...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div
                ref={embeddedSignupContainerRef}
                className="flex justify-center"
              >
                {/* Meta Embedded Signup Component */}
                <div
                  className="fb-login-button"
                  data-width="300"
                  data-size="large"
                  data-button-type="continue_with"
                  data-layout="default"
                  data-auto-logout-link="false"
                  data-use-continue-as="true"
                  data-scope="public_profile,email"
                  data-config-id={import.meta.env.VITE_FACEBOOK_CONFIG_ID || ''}
                />
              </div>
            </div>

            {/* Instrucciones adicionales */}
            <div className="text-center text-sm text-metal">
              <p>Al hacer clic en "Continuar", serás redirigido a Meta para autorizar el acceso.</p>
              <p className="mt-1">Este proceso es seguro y no compartiremos tu información.</p>
            </div>
          </div>
        )}

        {/* Estado y errores */}
        {status === 'loading' && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-center">
              <FiLoader className="animate-spin h-5 w-5 text-blue-400 mr-2" />
              <p className="text-sm text-blue-700">Procesando autorización...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex items-center">
              <FiCheck className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-700">
                ¡Conexión exitosa! Configurando tu integración...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-dark mb-2">📱 Siguiente paso</h4>
          <p className="text-sm text-metal">
            Después de conectar, podrás configurar cuándo y cómo responde tu chatbot:
          </p>
          <ul className="text-sm text-metal mt-2 space-y-1">
            <li>• Responder solo fuera del horario laboral</li>
            <li>• Activar solo para mensajes nuevos</li>
            <li>• Filtrar por palabras clave específicas</li>
          </ul>
        </div>

        {/* Botón de cancelar */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="mt-0"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}