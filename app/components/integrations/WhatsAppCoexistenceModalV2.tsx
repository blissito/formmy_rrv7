import { useState, useEffect, useRef, useCallback } from "react";
import { FiX, FiCheck, FiAlertCircle, FiLoader, FiSmartphone, FiRefreshCw } from "react-icons/fi";
import { QRCodeSVG } from 'qrcode.react';
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";

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

type IntegrationStep = 'select' | 'qr-scan' | 'syncing' | 'complete';
type IntegrationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function WhatsAppCoexistenceModalV2({
  isOpen,
  onClose,
  chatbotId,
  existingIntegration,
  onSuccess,
}: WhatsAppCoexistenceModalProps) {
  const [currentStep, setCurrentStep] = useState<IntegrationStep>('select');
  const [status, setStatus] = useState<IntegrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setStatus('idle');
      setError(null);
      setQrCode(null);
      setSessionId(null);
      setSyncProgress(0);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen]);

  /**
   * Iniciar el proceso de Embedded Signup con Coexistence
   */
  const startCoexistenceFlow = async () => {
    setStatus('loading');
    setError(null);

    try {
      // Solicitar QR code al backend
      const response = await fetch('/api/v1/integrations/whatsapp/coexistence/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar el proceso de coexistencia');
      }

      setQrCode(data.qrCode);
      setSessionId(data.sessionId);
      setCurrentStep('qr-scan');
      setStatus('idle');

      // Iniciar polling para verificar el estado
      startPolling(data.sessionId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  /**
   * Polling para verificar el estado de la conexión
   */
  const startPolling = (sessionId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/integrations/whatsapp/coexistence/status/${sessionId}`);
        const data = await response.json();

        if (data.status === 'connected') {
          // Conexión exitosa, iniciar sincronización
          clearInterval(pollIntervalRef.current!);
          setCurrentStep('syncing');
          startSync(sessionId);
        } else if (data.status === 'error') {
          clearInterval(pollIntervalRef.current!);
          setError(data.message || 'Error en la conexión');
          setStatus('error');
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
    }, 2000); // Check every 2 seconds
  };

  /**
   * Iniciar sincronización de contactos y historial
   */
  const startSync = async (sessionId: string) => {
    setStatus('loading');

    try {
      const response = await fetch('/api/v1/integrations/whatsapp/coexistence/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chatbotId,
          syncOptions: {
            contacts: true,
            chatHistory: true,
            historyMonths: 6
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al sincronizar datos');
      }

      // Simular progreso de sincronización
      const syncInterval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            clearInterval(syncInterval);
            setCurrentStep('complete');
            setStatus('success');

            // Llamar a onSuccess después de un breve delay
            setTimeout(() => {
              onSuccess({
                ...data.integration,
                coexistenceMode: true,
                syncCompleted: true
              });
              onClose();
            }, 2000);

            return 100;
          }
          return prev + 10;
        });
      }, 500);

    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error al sincronizar');
    }
  };

  /**
   * Regenerar QR code si expira
   */
  const regenerateQR = async () => {
    setQrCode(null);
    await startCoexistenceFlow();
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title="WhatsApp Coexistence - Embedded Signup"
      size="lg"
    >
      <div className="space-y-6 mt-8">
        {/* Step 1: Selección del método */}
        {currentStep === 'select' && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/assets/chat/whatsapp.svg"
                  alt="WhatsApp"
                  className="w-8 h-8"
                />
                <div>
                  <h3 className="font-medium text-dark">WhatsApp Business Coexistence</h3>
                  <p className="text-sm text-metal">
                    Conecta tu WhatsApp Business App existente con la API
                  </p>
                </div>
              </div>
            </div>

            {/* Nueva opción de Coexistence */}
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h4 className="font-medium text-green-800 mb-2">
                🔄 Connect your existing WhatsApp Business App
              </h4>
              <ul className="text-sm text-green-700 space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>Mantén tu número y conversaciones actuales</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>Sincroniza contactos y 6 meses de historial</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>Usa la app móvil y API simultáneamente</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>Los mensajes se sincronizan entre app y API</span>
                </li>
              </ul>

              <Button
                onClick={startCoexistenceFlow}
                isLoading={status === 'loading'}
                className="w-full"
              >
                <FiSmartphone className="mr-2" />
                Conectar WhatsApp Business App existente
              </Button>
            </div>

            {/* Requisitos importantes */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Requisitos importantes</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• WhatsApp Business App versión 2.24.17 o superior</li>
                <li>• El número debe haber estado activo por al menos 7 días</li>
                <li>• Debes abrir la app al menos una vez cada 13 días</li>
                <li>• NO desinstales la app después de conectar</li>
              </ul>
            </div>

            {/* Regiones no soportadas */}
            <div className="text-xs text-gray-500 mt-4">
              <p className="font-medium mb-1">Regiones no soportadas:</p>
              <p>UE, Reino Unido, Australia, Japón, Nigeria, Filipinas, Rusia, Corea del Sur, Sudáfrica, Turquía</p>
            </div>
          </>
        )}

        {/* Step 2: Escanear QR */}
        {currentStep === 'qr-scan' && (
          <>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">
                Escanea el código QR con WhatsApp Business
              </h3>

              {qrCode ? (
                <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                  <QRCodeSVG value={qrCode} size={256} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <FiLoader className="animate-spin h-8 w-8 text-blue-500" />
                </div>
              )}

              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-600">
                  1. Abre WhatsApp Business en tu teléfono
                </p>
                <p className="text-sm text-gray-600">
                  2. Ve a Configuración → Dispositivos vinculados
                </p>
                <p className="text-sm text-gray-600">
                  3. Toca "Vincular dispositivo"
                </p>
                <p className="text-sm text-gray-600">
                  4. Escanea este código QR
                </p>
              </div>

              <button
                onClick={regenerateQR}
                className="mt-4 text-sm text-blue-600 hover:underline flex items-center justify-center mx-auto"
              >
                <FiRefreshCw className="mr-1" />
                Regenerar código QR
              </button>

              <div className="mt-6 flex items-center justify-center">
                <FiLoader className="animate-spin mr-2 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Esperando conexión...
                </span>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Sincronizando */}
        {currentStep === 'syncing' && (
          <div className="text-center">
            <h3 className="text-lg font-medium mb-6">
              Sincronizando tu cuenta
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Conectando con WhatsApp API...</span>
                <FiCheck className="text-green-500" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Sincronizando contactos...</span>
                {syncProgress >= 30 ? (
                  <FiCheck className="text-green-500" />
                ) : (
                  <FiLoader className="animate-spin text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Importando historial de chat (6 meses)...</span>
                {syncProgress >= 60 ? (
                  <FiCheck className="text-green-500" />
                ) : (
                  <FiLoader className="animate-spin text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Configurando webhooks...</span>
                {syncProgress >= 90 ? (
                  <FiCheck className="text-green-500" />
                ) : (
                  <FiLoader className="animate-spin text-gray-400" />
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {syncProgress}% completado
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Completado */}
        {currentStep === 'complete' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <FiCheck className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <h3 className="text-lg font-medium mb-2">
              ¡Conexión exitosa!
            </h3>

            <p className="text-gray-600 mb-6">
              Tu WhatsApp Business App está conectada en modo coexistencia
            </p>

            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-medium text-blue-800 mb-2">🎉 Ya puedes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Responder desde la app móvil o el chatbot</li>
                <li>• Ver todos los mensajes en ambos lugares</li>
                <li>• Usar campañas y automatizaciones avanzadas</li>
                <li>• Mantener conversaciones personales cuando lo necesites</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded text-left">
              <p className="text-xs text-yellow-700">
                <strong>Recordatorio:</strong> Abre WhatsApp Business al menos cada 13 días para mantener la conexión activa
              </p>
            </div>
          </div>
        )}

        {/* Errores */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="mt-0"
          >
            {currentStep === 'complete' ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}