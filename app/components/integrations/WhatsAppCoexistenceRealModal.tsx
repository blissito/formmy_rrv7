import { useState, useEffect } from "react";
import { FiCheck, FiAlertCircle, FiLoader, FiExternalLink } from "react-icons/fi";
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";
import { Input } from "../chat/common/Input";

interface WhatsAppCoexistenceRealModalProps {
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

interface FormData {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

export default function WhatsAppCoexistenceRealModal({
  isOpen,
  onClose,
  chatbotId,
  existingIntegration,
  onSuccess,
}: WhatsAppCoexistenceRealModalProps) {
  const [formData, setFormData] = useState<FormData>({
    phoneNumberId: existingIntegration?.phoneNumberId || '',
    accessToken: '',
    businessAccountId: existingIntegration?.businessAccountId || '',
  });

  const [status, setStatus] = useState<IntegrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; coexistenceDetected?: boolean } | null>(null);

  const isEditing = !!existingIntegration;

  // Reset form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        phoneNumberId: existingIntegration?.phoneNumberId || '',
        accessToken: '',
        businessAccountId: existingIntegration?.businessAccountId || '',
      });
      setStatus('idle');
      setError(null);
      setTestResult(null);
    }
  }, [isOpen, existingIntegration]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear test result when user changes input
    if (testResult) {
      setTestResult(null);
    }
  };

  const validateForm = (): boolean => {
    const { phoneNumberId, accessToken, businessAccountId } = formData;
    return !!(phoneNumberId.trim() && accessToken.trim() && businessAccountId.trim());
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/v1/integrations/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'test_coexistence',
          chatbotId,
          ...formData,
          integrationId: existingIntegration?.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.coexistenceDetected
            ? '¡Coexistencia activa! Tu número funciona en App y API.'
            : 'Conexión exitosa. Credenciales válidas.',
          coexistenceDetected: data.coexistenceDetected
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Error al probar la conexión'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Error de conexión. Verifica tus credenciales.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testResult?.success) {
      setError('Debes probar la conexión exitosamente antes de guardar');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/v1/integrations/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: isEditing ? 'update' : 'create',
          chatbotId,
          ...formData,
          enableCoexistence: true,
          integrationId: existingIntegration?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar la integración');
      }

      setStatus('success');
      onSuccess({
        ...data,
        coexistenceMode: true,
        coexistenceEnabled: testResult.coexistenceDetected
      });
      onClose();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title={`${isEditing ? 'Actualizar' : 'Conectar'} WhatsApp`}
      size="md"
    >
      <div className="space-y-6">
        {/* Header simple */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <img src="/assets/chat/whatsapp.svg" alt="WhatsApp" className="w-10 h-10" />
          </div>
          <p className="text-sm text-gray-600">
            Conecta tu número de WhatsApp Business con modo coexistencia
          </p>
        </div>

        {/* Instrucciones compactas */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">Obtener credenciales:</p>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Ve a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">Meta for Developers <FiExternalLink className="ml-1 w-3 h-3" /></a></li>
            <li>2. Tu app → WhatsApp → API Setup</li>
            <li>3. Copia Phone Number ID, Access Token y Business Account ID</li>
          </ol>
        </div>

        {/* Form compacto */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone Number ID"
            name="phoneNumberId"
            value={formData.phoneNumberId}
            onChange={(value) => handleInputChange('phoneNumberId', value)}
            placeholder="123456789012345"
            required
          />

          <Input
            label="Access Token"
            name="accessToken"
            value={formData.accessToken}
            onChange={(value) => handleInputChange('accessToken', value)}
            placeholder="EAAxxxxxxxxxxxxxxx"
            type="password"
            required
          />

          <Input
            label="Business Account ID"
            name="businessAccountId"
            value={formData.businessAccountId}
            onChange={(value) => handleInputChange('businessAccountId', value)}
            placeholder="123456789012345"
            required
          />

          {/* Test result compacto */}
          {testResult && (
            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {testResult.success ? (
                  <FiCheck className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                ) : (
                  <FiAlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                )}
                <span className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.message}
                </span>
              </div>
              {testResult.success && testResult.coexistenceDetected && (
                <div className="mt-2 text-xs text-green-600">
                  ✨ Tu número está configurado para coexistencia
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <FiAlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTestConnection}
              isDisabled={isTesting || status === 'loading'}
              className="w-max m-0 flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <FiLoader className="animate-spin" />
                  Probando...
                </>
              ) : (
                'Probar conexión'
              )}
            </Button>

            <Button
              type="submit"
              isDisabled={!testResult?.success || status === 'loading'}
              isLoading={status === 'loading'}
              className="w-max m-0"
            >
              {isEditing ? 'Actualizar' : 'Conectar'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}