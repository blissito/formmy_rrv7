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

interface WhatsAppEmbeddedSignupModalProps {
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

export default function WhatsAppEmbeddedSignupModal({
  isOpen,
  onClose,
  chatbotId,
  existingIntegration,
  onSuccess,
}: WhatsAppEmbeddedSignupModalProps) {
  const [status, setStatus] = useState<IntegrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Cargar Facebook SDK para Embedded Signup
  useEffect(() => {
    if (!isOpen) return;

    const loadFacebookSDK = () => {
      // Si ya está cargado
      if (window.FB) {
        setIsSDKLoaded(true);
        return;
      }

      // Configurar callback para cuando el SDK esté listo
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v17.0' // Usar versión estable
        });
        setIsSDKLoaded(true);
      };

      // Cargar script del SDK
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    loadFacebookSDK();

    return () => {
      // Cleanup si es necesario
    };
  }, [isOpen]);

  // Handler para el Embedded Signup
  const handleEmbeddedSignup = useCallback(async () => {
    if (!window.FB) {
      setError('Facebook SDK no está cargado');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Iniciar Embedded Signup usando Facebook Login for Business
      window.FB.login(
        (response: any) => {
          console.log('Embedded Signup Response:', response);

          if (response.status === 'connected' && response.authResponse?.code) {
            // Procesar respuesta sin async en el callback
            const processResponse = async () => {
              try {
                console.log('🚀 [Modal] Iniciando proceso de conexión WhatsApp...');

                // PASO 1: Intercambiar código por tokens con Meta
                console.log('📞 [Modal] PASO 1: Intercambiando código por tokens con Meta...');
                const exchangeResponse = await fetch('/api/v1/integrations/whatsapp/embedded_signup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chatbotId,
                    authResponse: response.authResponse,
                    status: response.status,
                  }),
                });

                const exchangeData = await exchangeResponse.json();

                if (!exchangeResponse.ok) {
                  console.error('❌ [Modal] PASO 1 FALLÓ:', exchangeData.error);
                  throw new Error(exchangeData.error || 'Error al intercambiar tokens con Meta');
                }

                console.log('✅ [Modal] PASO 1 COMPLETADO - Tokens obtenidos de Meta:', {
                  hasAccessToken: !!exchangeData.integration?.token,
                  phoneNumberId: exchangeData.integration?.phoneNumberId,
                  waba: exchangeData.integration?.businessAccountId
                });

                // PASO 2: Registrar en Composio con los tokens de Meta
                console.log('📞 [Modal] PASO 2: Registrando en Composio...');
                const composioResponse = await fetch('/api/v1/composio/whatsapp?intent=connect', {
                  method: 'POST',
                  body: new URLSearchParams({
                    chatbotId: chatbotId,
                    accessToken: exchangeData.integration.token, // Token de Meta
                    phoneNumberId: exchangeData.integration.phoneNumberId,
                    whatsappBusinessAccountId: exchangeData.integration.businessAccountId || ''
                  })
                });

                console.log('📥 [Modal] Respuesta de Composio recibida (status:', composioResponse.status, ')');

                const composioData = await composioResponse.json();

                if (!composioResponse.ok) {
                  console.error('❌ [Modal] PASO 2 FALLÓ - Error registrando en Composio:', composioData);
                  console.error('❌ [Modal] Status HTTP:', composioResponse.status);
                  console.error('❌ [Modal] Error message:', composioData.error);

                  // CRÍTICO: NO cerrar modal, mostrar error al usuario
                  setStatus('error');
                  setError(
                    `Fallo en registro de Composio: ${composioData.error || 'Error desconocido'}. ` +
                    `La integración de Meta se guardó pero no se pudo activar Composio. ` +
                    `Por favor, intenta desconectar y volver a conectar.`
                  );

                  // NO llamar onSuccess ni cerrar modal
                  return; // Salir sin cerrar modal
                }

                console.log('✅ [Modal] PASO 2 COMPLETADO - Registrado en Composio:', composioData);

                // SOLO si ambas operaciones fueron exitosas, actualizar estado
                console.log('🎉 [Modal] PROCESO COMPLETO - Actualizando UI...');
                setStatus('success');
                onSuccess({
                  ...exchangeData.integration,
                  embeddedSignup: true,
                  businessIntegrationToken: true,
                  composio: true, // Flag para indicar que está conectado vía Composio
                });

                // Cerrar modal después de un breve retraso (SOLO si todo fue exitoso)
                console.log('⏱️  [Modal] Cerrando modal en 1.5 segundos...');
                setTimeout(() => {
                  console.log('✅ [Modal] Modal cerrado exitosamente');
                  onClose();
                }, 1500);

              } catch (exchangeError) {
                console.error('❌ [Modal] ERROR GENERAL en proceso de conexión:', exchangeError);
                setStatus('error');
                setError(
                  exchangeError instanceof Error
                    ? exchangeError.message
                    : 'Error al conectar WhatsApp'
                );
                // NO cerrar modal en caso de error
                console.log('⚠️  [Modal] Modal permanece abierto para mostrar error');
              }
            };

            // Ejecutar función async por separado
            processResponse();
          } else {
            console.log('User cancelled or failed to authorize');
            setStatus('error');
            setError('Autorización cancelada o fallida');
          }
        },
        {
          ...(import.meta.env.VITE_FACEBOOK_CONFIG_ID && {
            config_id: import.meta.env.VITE_FACEBOOK_CONFIG_ID
          }),
          scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management', // Permisos requeridos
          response_type: 'code', // Requerido para Embedded Signup
          override_default_response_type: true,
          extras: {
            setup: {
              // Configuración específica para WhatsApp
              external_business_id: chatbotId,
            }
          }
        }
      );
    } catch (err) {
      console.error('Embedded Signup error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error al inicializar Embedded Signup');
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
      title="WhatsApp Business Platform - Embedded Signup"
      size="lg"
    >
      <div className="space-y-6 mt-8">
        {/* Header simple */}
        <div className="text-center">
          <img
            src="/assets/chat/whatsapp.svg"
            alt="WhatsApp"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-dark mb-2">Conectar WhatsApp</h3>
          <p className="text-sm text-metal">
            Conecta tu número de WhatsApp Business para que tus agentes puedan enviar mensajes automáticamente
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
            {/* Embedded Signup Button */}
            <button
              onClick={handleEmbeddedSignup}
              disabled={status === 'loading'}
              className="w-full px-6 py-3 text-white font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#25D366' }}
            >
              {status === 'loading' ? (
                <>
                  <FiLoader className="animate-spin h-5 w-5" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Conectar con WhatsApp</span>
                </>
              )}
            </button>

            {/* Información adicional */}
            <p className="text-center text-xs text-metal">
              Se abrirá una ventana de Facebook para autorizar tu cuenta de WhatsApp Business
            </p>
          </div>
        )}

        {/* Estados de éxito y error */}
        {status === 'success' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex items-center justify-center">
              <FiCheck className="h-6 w-6 text-green-500 mr-2" />
              <p className="text-green-700 font-medium">
                ¡WhatsApp conectado exitosamente!
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


        {/* Botón de cancelar */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="mt-0"
          >
            {status === 'success' ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}