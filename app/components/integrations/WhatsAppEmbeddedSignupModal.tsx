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
    // Mock para desarrollo local (localhost)
    if (window.location.hostname === 'localhost') {
      setStatus('loading');
      setError(null);

      console.log('🧪 MOCK: Simulando Embedded Signup en localhost');

      // Simular respuesta de Facebook
      setTimeout(async () => {
        try {
          const mockResponse = {
            chatbotId,
            code: 'mock_code_12345',
            accessToken: 'mock_access_token',
            userID: 'mock_user_id',
          };

          const exchangeResponse = await fetch('/api/v1/integrations/whatsapp/embedded_signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockResponse),
          });

          const data = await exchangeResponse.json();

          if (!exchangeResponse.ok) {
            throw new Error(data.error || 'Error al procesar la autorización');
          }

          setStatus('success');
          onSuccess({
            ...data.integration,
            embeddedSignup: true,
            mockMode: true,
          });

          setTimeout(() => {
            onClose();
          }, 1500);

        } catch (error) {
          console.error('Mock exchange error:', error);
          setStatus('error');
          setError(error instanceof Error ? error.message : 'Error en modo mock');
        }
      }, 2000);

      return;
    }

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

                const data = await exchangeResponse.json();

                if (!exchangeResponse.ok) {
                  throw new Error(data.error || 'Error al procesar la autorización');
                }

                setStatus('success');
                onSuccess({
                  ...data.integration,
                  embeddedSignup: true,
                  businessIntegrationToken: true,
                });

                // Cerrar modal después de un breve retraso
                setTimeout(() => {
                  onClose();
                }, 1500);

              } catch (exchangeError) {
                console.error('Token exchange error:', exchangeError);
                setStatus('error');
                setError(exchangeError instanceof Error ? exchangeError.message : 'Error al intercambiar tokens');
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
          config_id: import.meta.env.VITE_FACEBOOK_CONFIG_ID, // Si tienes configuración personalizada
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
        {/* Header con información */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/assets/chat/whatsapp.svg"
              alt="WhatsApp"
              className="w-8 h-8"
            />
            <div>
              <h3 className="font-medium text-dark">WhatsApp Business Platform</h3>
              <p className="text-sm text-metal">
                Conecta directamente con la plataforma oficial de Meta
              </p>
            </div>
          </div>
        </div>

        {/* Información sobre Embedded Signup */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">🚀 Embedded Signup Official</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Autenticación directa con Facebook Login for Business</li>
            <li>• Genera Business Integration System User Access Tokens</li>
            <li>• Selecciona o crea WhatsApp Business Account automáticamente</li>
            <li>• Verificación de número de teléfono de negocio incluida</li>
            <li>• Soporte para números de teléfono comercial reales</li>
          </ul>
        </div>

        {/* INSTRUCCIONES WEBHOOK - SIEMPRE VISIBLE */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
            ⚠️ CONFIGURACIÓN REQUERIDA: Webhook
          </h4>

          <div className="text-sm text-orange-700 space-y-3">
            <p className="font-medium">Después de la autorización, configura en Meta for Developers:</p>

            <div className="bg-white p-3 rounded border space-y-2">
              <div>
                <span className="font-medium">1. Callback URL:</span>
                <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs break-all">
                  https://formmy-whatsapp-bridge.fixtergeek.workers.dev/webhook
                </div>
              </div>

              <div>
                <span className="font-medium">2. Verify Token:</span>
                <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                  formmy_wh_2024_secure_token_f7x9k2m8
                </div>
              </div>

              <div>
                <span className="font-medium">3. Eventos a subscribir:</span>
                <div className="bg-gray-100 p-2 rounded mt-1 text-xs">
                  ✅ messages<br/>
                  ✅ smb_message_echoes
                </div>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p><span className="font-medium">Ruta:</span> Meta for Developers → WhatsApp → Configuration → Webhooks</p>
              <p><span className="font-medium">Importante:</span> Tu app debe estar en modo LIVE, no Development</p>
            </div>
          </div>
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
            <div className="text-center">
              <Button
                onClick={handleEmbeddedSignup}
                isLoading={status === 'loading'}
                className="w-full py-4 text-lg"
                style={{
                  backgroundColor: '#1877F2',
                  color: 'white',
                }}
              >
                {status === 'loading' ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Procesando autorización...
                  </>
                ) : (
                  <>
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDEyQzI0IDUuMzczIDE4LjYyNyAwIDEyIDEyIDVzNS4zNzMgMTIgMTIgMTJjMi4zMTggMCA0LjgyNC0xLjI3IDQuODI0LTMuMTc0IDAtMC43NzUtLjM2LTEuNzM2LTIuODE5LTEuNzM2LTIuNDU5IDAtOC4zODUgMi41MzItMTAuNTU4IDIuNTMyQzguODE5IDExLjgzNyA3LjU0IDExLjc2MiA3LjU0IDEyYzAtLjIzOCAxLjI3OS0uMzEzIDMuNjM2LS4zMTMgNC4xMzEgMCA3LjU0LTEuNTM0IDcuNTQtMy40MjQgMC0xLjI3OS0xLjU0LTIuMTY0LTMuNjY0LTIuMTY0LTIuMTI0IDAtNC41MTEgMi4xNjQtNC41MTEgMi4xNjQtMS4xNTQgMS4xMDMtMi45OTcgMS4xMDMtNC4xNTEgMC0xLjE1NC0xLjEwMy0xLjE1NC0yLjg5NyAwLTRzMi44OTctMS4xNTQgNC0xLjE1NGMxLjEwMy0yLjg5NyAxLjEwMy0xLjE1NCAwLTQtMi44OTcgMC00LTIuODk3Ii8+PC9zdmc+"
                      alt="Facebook"
                      className="w-5 h-5 mr-2 inline"
                    />
                    Conectar con WhatsApp Business
                  </>
                )}
              </Button>
            </div>

            {/* Información adicional */}
            <div className="text-center text-sm text-metal">
              <p>
                Al hacer clic, serás redirigido a Facebook para autorizar el acceso a tu
                WhatsApp Business Account
              </p>
            </div>
          </div>
        )}

        {/* Estados de éxito y error */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex items-center">
                <FiCheck className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-sm text-green-700">
                  ¡Autorización exitosa! Ahora configura el webhook...
                </p>
              </div>
            </div>

            {/* Configuración del Webhook - PASO CRÍTICO */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                ⚠️ PASO OBLIGATORIO: Configurar Webhook
              </h4>

              <div className="text-sm text-orange-700 space-y-3">
                <p className="font-medium">Ve a Meta for Developers y configura:</p>

                <div className="bg-white p-3 rounded border space-y-2">
                  <div>
                    <span className="font-medium">1. Callback URL:</span>
                    <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs break-all">
                      https://formmy-whatsapp-bridge.fixtergeek.workers.dev/webhook
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">2. Verify Token:</span>
                    <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                      formmy_wh_2024_secure_token_f7x9k2m8
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">3. Eventos a subscribir:</span>
                    <div className="bg-gray-100 p-2 rounded mt-1 text-xs">
                      ✅ messages<br/>
                      ✅ smb_message_echoes
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <p><span className="font-medium">Ruta:</span> Meta for Developers → WhatsApp → Configuration → Webhooks</p>
                  <p><span className="font-medium">Importante:</span> Tu app debe estar en modo LIVE, no Development</p>
                </div>
              </div>
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

        {/* Límites y consideraciones */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-dark mb-2">📊 Límites de Onboarding</h4>
          <ul className="text-sm text-metal space-y-1">
            <li>• Por defecto: 10 nuevos clientes por periodo de 7 días</li>
            <li>• Después de verificación: Hasta 200 nuevos clientes por periodo</li>
            <li>• Se requiere App Review para acceso avanzado</li>
            <li>• Soporte automático para 30 idiomas</li>
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
            {status === 'success' ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}