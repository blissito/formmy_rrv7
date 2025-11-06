import { useState, useEffect, useCallback, useRef } from "react";
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
  const [embeddedSignupData, setEmbeddedSignupData] = useState<{
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
    sessionInfoVerified?: boolean;
  } | null>(null);

  // Referencia al popup para cerrarlo cuando llega el mensaje FINISH
  const popupRef = useRef<Window | null>(null);

  // Cargar Facebook SDK para FB.login()
  useEffect(() => {
    if (!isOpen) return;

    const loadFacebookSDK = () => {
      if (window.FB) {
        setIsSDKLoaded(true);
        return;
      }

      window.fbAsyncInit = function() {
        const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
        const configId = import.meta.env.VITE_FACEBOOK_CONFIG_ID;

        if (!appId) {
          console.error('❌ [Modal] VITE_FACEBOOK_APP_ID no configurado');
          setError('Error de configuración: Facebook App ID no está configurado. Contacta al administrador.');
          return;
        }

        if (!configId) {
          console.error('❌ [Modal] VITE_FACEBOOK_CONFIG_ID no configurado');
          setError('Error de configuración: Facebook Config ID no está configurado. Necesitas obtenerlo desde el Facebook App Dashboard (WhatsApp → Embedded Signup → Configuration).');
          return;
        }

        window.FB.init({
          appId: appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v24.0'
        });
        setIsSDKLoaded(true);
      };

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
  }, [isOpen]);

  // Message Event Listener - Captura mensaje FINISH de Meta con waba_id y phone_number_id
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // ✅ Mensajes de Meta con waba_id y phone_number_id
      if (event.origin === 'https://www.facebook.com' || event.origin === 'https://staticxx.facebook.com') {
        console.log('📨 [Message Event] Origen:', event.origin);
        console.log('📨 [Message Event] Data raw:', event.data);
      }

      // Verificar origen de Facebook
      if (event.origin !== 'https://www.facebook.com') return;

      try {
        // Intentar parsear como JSON primero
        const data = JSON.parse(event.data);

        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('📨 [Message Event] Received:', data.event, data.data);

          // Manejar diferentes eventos del flujo
          switch (data.event) {
            case 'FINISH':
            case 'FINISH_ONLY_WABA':
            case 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING':
              // ✅ CRÍTICO: Guardar waba_id y phone_number_id del message event
              const wabaId = data.data.waba_id;
              const phoneNumberId = data.data.phone_number_id;

              console.log('✅ [Message Event] Captured:', { wabaId, phoneNumberId });

              // Guardar en state para referencia
              setEmbeddedSignupData({
                phone_number_id: phoneNumberId,
                waba_id: wabaId,
                business_id: data.data.business_id,
                sessionInfoVerified: data.data.sessionInfoVerified,
              });

              // ✅ CERRAR POPUP INMEDIATAMENTE
              if (popupRef.current && !popupRef.current.closed) {
                console.log('🔄 [Message Event] Cerrando popup...');
                popupRef.current.close();
                popupRef.current = null;
              }

              // ✅ PROCESAR INMEDIATAMENTE - No esperar a que el popup cierre
              console.log('🚀 [Message Event] Procesando conexión inmediatamente...');

              const processConnection = async () => {
                setStatus('loading');

                try {
                  const response = await fetch('/api/v1/integrations/whatsapp/embedded_signup', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      chatbotId: chatbotId,
                      wabaId: wabaId,
                      phoneNumberId: phoneNumberId,
                    }),
                  });

                  const responseData = await response.json();

                  if (!response.ok && response.status !== 207) {
                    console.error('❌ [Embedded Signup] Backend error:', responseData.error);
                    throw new Error(responseData.error || 'Error al conectar WhatsApp');
                  }

                  // ✅ Éxito
                  console.log('✅ [Embedded Signup] WhatsApp conectado exitosamente!');
                  setStatus('success');
                  onSuccess({
                    ...responseData.integration,
                    embeddedSignup: true,
                  });

                  // Limpiar sessionStorage
                  sessionStorage.removeItem('whatsapp_oauth_state');
                  sessionStorage.removeItem('whatsapp_oauth_nonce');
                  sessionStorage.removeItem('whatsapp_oauth_chatbotId');

                  // Cerrar modal después de un breve retraso para mostrar éxito
                  setTimeout(() => {
                    onClose();
                  }, 2000);

                } catch (err) {
                  console.error('❌ [Embedded Signup] Error procesando:', err);
                  setStatus('error');
                  setError(err instanceof Error ? err.message : 'Error al conectar WhatsApp');
                }
              };

              processConnection();
              break;

            case 'CANCEL':
              console.warn('⚠️ [Message Event] Flujo cancelado');
              if (data.data.current_step) {
                console.warn('📍 [Message Event] Abandonó en:', data.data.current_step);
                setError(`Flujo cancelado en: ${data.data.current_step}`);
              }
              if (data.data.error_message) {
                console.error('❌ [Message Event] Error:', data.data.error_message);
                setError(`Error: ${data.data.error_message}`);
              }
              setStatus('error');
              break;

            default:
              console.log('📨 [Message Event] Evento desconocido:', data.event);
          }
        }
      } catch (parseError) {
        // Si no es JSON, intentar parsear como URL-encoded string
        if (typeof event.data === 'string' && event.data.includes('signed_request=')) {
          try {
            console.log('🔍 [Message Event] Parseando URL-encoded data...');
            const params = new URLSearchParams(event.data);
            const signedRequest = params.get('signed_request');

            if (signedRequest) {
              console.log('🔍 [Message Event] signed_request encontrado');

              const parts = signedRequest.split('.');
              if (parts.length === 2) {
                const payload = parts[1];
                const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = atob(base64);
                const decoded = JSON.parse(jsonPayload);

                console.log('✅ [Message Event] Signed request decoded:', decoded);

                setEmbeddedSignupData({
                  sessionInfoVerified: true,
                });
              }
            }
          } catch (decodeError) {
            console.warn('⚠️ [Message Event] Error decodificando signed_request:', decodeError);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, chatbotId, embeddedSignupData, onSuccess, onClose]);

  // Procesar respuesta de FB.login() (función async separada)
  const processAuthResponse = useCallback(async (response: any) => {
    console.log('📥 [FB.login] Response:', response);

    if (response.authResponse) {
      const accessToken = response.authResponse.accessToken;
      console.log('✅ [FB.login] Access Token recibido:', accessToken?.substring(0, 20) + '...');

      try {
        // Esperar a que el message event capture waba_id y phone_number_id
        // (usualmente llega antes que authResponse, pero por si acaso esperamos un poco)
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!embeddedSignupData?.waba_id || !embeddedSignupData?.phone_number_id) {
          console.warn('⚠️ [FB.login] No se recibió waba_id del message event');
          // Continuar de todas formas, el backend intentará obtenerlo
        }

        // Enviar al backend: accessToken + waba_id + phone_number_id
        const exchangeResponse = await fetch('/api/v1/integrations/whatsapp/embedded_signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatbotId,
            accessToken, // ✅ Token directo, no code
            // Enviar datos del message event si están disponibles
            wabaId: embeddedSignupData?.waba_id,
            phoneNumberId: embeddedSignupData?.phone_number_id,
          }),
        });

        const exchangeData = await exchangeResponse.json();

        if (!exchangeResponse.ok && exchangeResponse.status !== 207) {
          console.error('❌ [FB.login] Backend error:', exchangeData.error);

          // Si hay instrucciones detalladas, mostrarlas
          if (exchangeData.instructions && Array.isArray(exchangeData.instructions)) {
            const instructionsText = [
              exchangeData.error || 'Error al conectar WhatsApp',
              '',
              ...exchangeData.instructions
            ].join('\n');
            throw new Error(instructionsText);
          }

          throw new Error(exchangeData.error || 'Error al conectar WhatsApp');
        }

        // ✅ Éxito
        console.log('✅ [FB.login] WhatsApp conectado exitosamente!');
        setStatus('success');
        onSuccess({
          ...exchangeData.integration,
          embeddedSignup: true,
        });

        // Cerrar modal después de un breve retraso
        setTimeout(() => {
          onClose();
        }, 1500);

      } catch (err) {
        console.error('❌ [FB.login] Error procesando respuesta:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Error al conectar WhatsApp');
      }

    } else {
      console.warn('⚠️ [FB.login] Usuario canceló login');
      setStatus('error');
      setError('Autorización cancelada');
    }
  }, [chatbotId, embeddedSignupData, onSuccess, onClose]);

  // ✅ POPUP FLOW - OAuth code flow con popup manual (como Meta Docs)
  const handleEmbeddedSignup = useCallback(() => {
    setStatus('loading');
    setError(null);

    try {
      const configId = import.meta.env.VITE_FACEBOOK_CONFIG_ID;
      const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

      if (!configId || !appId) {
        setError('Error de configuración: faltan VITE_FACEBOOK_CONFIG_ID o VITE_FACEBOOK_APP_ID');
        return;
      }

      // Generar state para CSRF y nonce
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      sessionStorage.setItem('whatsapp_oauth_state', state);
      sessionStorage.setItem('whatsapp_oauth_nonce', nonce);
      sessionStorage.setItem('whatsapp_oauth_chatbotId', chatbotId);

      // Redirect URI - mismo dominio (popup window)
      const redirectUri = `${window.location.origin}/dashboard/integrations/whatsapp/callback`;

      console.log('🚀 [Popup OAuth] Abriendo popup de Embedded Signup...');
      console.log('🔑 Config ID:', configId);
      console.log('📍 Redirect URI:', redirectUri);
      console.log('🔐 State:', state);

      // ✅ Construir URL de OAuth Dialog con display=popup (como Meta Docs)
      const authUrl = new URL('https://www.facebook.com/v24.0/dialog/oauth');
      authUrl.searchParams.set('display', 'popup'); // ← CLAVE
      authUrl.searchParams.set('client_id', appId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('config_id', configId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('override_default_response_type', 'true'); // ← CLAVE
      authUrl.searchParams.set('fallback_redirect_uri', redirectUri);
      authUrl.searchParams.set('extras', JSON.stringify({
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: '3',
        version: 'v3',
        features: []
      }));

      console.log('🔗 [Popup OAuth] URL completa:', authUrl.toString());

      // Abrir popup (ventana centrada)
      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl.toString(),
        'whatsapp_embedded_signup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
      );

      if (!popup) {
        setError('No se pudo abrir el popup. Por favor, habilita los popups para este sitio.');
        setStatus('error');
        return;
      }

      // Guardar referencia del popup para cerrarlo cuando llegue el mensaje FINISH
      popupRef.current = popup;

      // Monitorear cuando el popup cierra (solo para logging)
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          console.log('🔄 [Popup OAuth] Popup cerrado');
          popupRef.current = null;
          // La conexión ya fue procesada en el message event FINISH
        }
      }, 500);

    } catch (err) {
      console.error('❌ [Embedded Signup] Error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error al inicializar Embedded Signup');
    }
  }, [chatbotId, embeddedSignupData, onSuccess, onClose]);

  // Popup flow NO necesita procesar OAuth callback - el token llega directamente a processAuthResponse

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title="WhatsApp Business Platform"
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
          <h3 className="text-lg font-medium text-dark mb-2">Connect WhatsApp</h3>
          <p className="text-sm text-metal">
            Connect your WhatsApp Business number so your agents can send automated messages
          </p>
        </div>

        {/* SDK Loading Status */}
        {!isSDKLoaded ? (
          <div className="flex items-center justify-center py-8">
            <FiLoader className="animate-spin h-6 w-6 text-blue-500 mr-2" />
            <span className="text-metal">Loading Facebook SDK...</span>
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
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Connect with WhatsApp</span>
                </>
              )}
            </button>

            {/* Información adicional */}
            <p className="text-center text-xs text-metal">
              A Facebook window will open to authorize your WhatsApp Business account
            </p>
          </div>
        )}

        {/* Estados de éxito y error */}
        {status === 'success' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex items-center justify-center">
              <FiCheck className="h-6 w-6 text-green-500 mr-2" />
              <p className="text-green-700 font-medium">
                WhatsApp connected successfully!
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-start">
              <FiAlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                {error.includes('business.facebook.com') && (
                  <a
                    href="https://business.facebook.com/latest/whatsapp_manager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Abrir Meta Business Suite →
                  </a>
                )}
              </div>
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
            {status === 'success' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}