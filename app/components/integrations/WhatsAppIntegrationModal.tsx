import { useState, useEffect } from "react";
import { FiX, FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";
import { Input } from "../chat/common/Input";

type IntegrationStatus = 'idle' | 'loading' | 'success' | 'error';

interface WhatsAppIntegrationModalProps {
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

interface FormData {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface FormValidation {
  phoneNumberId: { isValid: boolean; error?: string };
  accessToken: { isValid: boolean; error?: string };
  businessAccountId: { isValid: boolean; error?: string };
  webhookVerifyToken: { isValid: boolean; error?: string };
}

export default function WhatsAppIntegrationModal({
  isOpen,
  onClose,
  chatbotId,
  existingIntegration,
  onSuccess,
}: WhatsAppIntegrationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    phoneNumberId: existingIntegration?.phoneNumberId || '',
    accessToken: '', // Never pre-fill access token for security
    businessAccountId: existingIntegration?.businessAccountId || '',
    webhookVerifyToken: existingIntegration?.webhookVerifyToken || '',
  });

  const [validation, setValidation] = useState<FormValidation>({
    phoneNumberId: { isValid: true },
    accessToken: { isValid: true },
    businessAccountId: { isValid: true },
    webhookVerifyToken: { isValid: true },
  });

  const [status, setStatus] = useState<IntegrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset form when opening/closing the modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        phoneNumberId: existingIntegration?.phoneNumberId || '',
        accessToken: '',
        businessAccountId: existingIntegration?.businessAccountId || '',
        webhookVerifyToken: existingIntegration?.webhookVerifyToken || '',
      });
      setStatus('idle');
      setError(null);
      setTestResult(null);
    }
  }, [isOpen, existingIntegration]);

  const validateField = (field: keyof FormData, value: string): boolean => {
    if (!value.trim()) {
      setValidation(prev => ({
        ...prev,
        [field]: { 
          isValid: false, 
          error: 'Este campo es obligatorio' 
        }
      }));
      return false;
    }

    // Additional validation for specific fields
    if (field === 'phoneNumberId' && !/^\d+$/.test(value)) {
      setValidation(prev => ({
        ...prev,
        [field]: { 
          isValid: false, 
          error: 'El ID de teléfono debe contener solo números' 
        }
      }));
      return false;
    }

    // Clear any previous errors
    setValidation(prev => ({
      ...prev,
      [field]: { isValid: true }
    }));
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field on change
    if (validation[name as keyof FormData]?.isValid === false) {
      validateField(name as keyof FormData, value);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const fields: (keyof FormData)[] = ['phoneNumberId', 'accessToken', 'businessAccountId'];
    
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;
    
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const requestBody: any = {
        intent: 'test',
        chatbotId,
        phoneNumberId: formData.phoneNumberId,
        accessToken: formData.accessToken,
        businessAccountId: formData.businessAccountId,
      };

      // Si es una integración existente, incluir el ID
      if (existingIntegration?.id) {
        requestBody.integrationId = existingIntegration.id;
      }

      const response = await fetch('/api/v1/integrations/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Test connection response:', data);

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: '¡Conexión exitosa! Las credenciales son válidas.'
        });
      } else {
        const errorMessage = data.testResult?.message || data.message || 'Error al probar la conexión con WhatsApp';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error testing connection:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error desconocido al probar la conexión con WhatsApp'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus('loading');
    setError(null);

    try {
      // Always use POST method with intent field - the API handles routing internally
      const url = '/api/v1/integrations/whatsapp';
      const method = 'POST';

      const requestBody: any = {
        intent: existingIntegration ? 'update' : 'create',
        chatbotId,
        phoneNumberId: formData.phoneNumberId,
        accessToken: formData.accessToken,
        businessAccountId: formData.businessAccountId,
        webhookVerifyToken: formData.webhookVerifyToken || undefined,
      };

      // For updates, include the integration ID
      if (existingIntegration) {
        requestBody.integrationId = existingIntegration.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar la integración');
      }

      setStatus('success');
      onSuccess(data);
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
      title={existingIntegration ? 'Editar integración de WhatsApp' : 'Conectar WhatsApp'}
      size="lg"
    >
      <div className="space-y-6 mt-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/assets/chat/whatsapp.svg" 
              alt="WhatsApp" 
              className="w-8 h-8"
            />
            <div>
              <h3 className="font-medium text-dark">WhatsApp Business</h3>
              <p className="text-sm text-metal">
                Conecta tu chatbot con WhatsApp Business API
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-dark mb-2">💡 Cómo obtener las credenciales</h4>
          <ol className="text-sm text-metal space-y-1">
            <li>1. Ve al <a href="https://business.facebook.com/wa/manage/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Administrador de WhatsApp Business</a></li>
            <li>2. Selecciona tu aplicación o crea una nueva</li>
            <li>3. En "API Setup", encuentra el "Phone Number ID"</li>
            <li>4. Copia el "Access Token" (temporal o permanente)</li>
            <li>5. Anota el "Business Account ID" desde la configuración</li>
          </ol>
          <p className="text-xs text-metal mt-2">
            ⚠️ Guarda tus credenciales de forma segura. El access token permite el envío de mensajes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                label="ID de número de teléfono"
                name="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={(value) => handleInputChange({ target: { name: 'phoneNumberId', value } } as React.ChangeEvent<HTMLInputElement>)}
                onBlur={() => validateField('phoneNumberId', formData.phoneNumberId)}
                error={!validation.phoneNumberId.isValid ? validation.phoneNumberId.error : undefined}
                placeholder="123456789012345"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Input
                label="ID de cuenta de negocio"
                name="businessAccountId"
                value={formData.businessAccountId}
                onChange={(value) => handleInputChange({ target: { name: 'businessAccountId', value } } as React.ChangeEvent<HTMLInputElement>)}
                onBlur={() => validateField('businessAccountId', formData.businessAccountId)}
                error={!validation.businessAccountId.isValid ? validation.businessAccountId.error : undefined}
                placeholder="123456789012345"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Input
              type="text"
              label="Token de acceso"
              name="accessToken"
              value={formData.accessToken}
              onChange={(value) => handleInputChange({ target: { name: 'accessToken', value } } as React.ChangeEvent<HTMLInputElement>)}
              onBlur={() => validateField('accessToken', formData.accessToken)}
              error={!validation.accessToken.isValid ? validation.accessToken.error : undefined}
              placeholder="EAA..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              El token de acceso es sensible y se almacenará de forma segura.
            </p>
          </div>

          <div className="space-y-1">
            <Input
              label="Token de verificación de webhook (opcional)"
              name="webhookVerifyToken"
              value={formData.webhookVerifyToken}
              onChange={(value) => handleInputChange({ target: { name: 'webhookVerifyToken', value } } as React.ChangeEvent<HTMLInputElement>)}
              onBlur={() => validateField('webhookVerifyToken', formData.webhookVerifyToken)}
              error={!validation.webhookVerifyToken.isValid ? validation.webhookVerifyToken.error : undefined}
              placeholder="mi_token_secreto"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si lo dejas en blanco, se generará uno automáticamente.
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <div className="flex items-center">
                {testResult.success ? (
                  <FiCheck className="h-5 w-5 mr-2" />
                ) : (
                  <FiAlertCircle className="h-5 w-5 mr-2" />
                )}
                <p className="text-sm">{testResult.message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTestConnection}
              isDisabled={isTesting || status === 'loading'}
              className="w-full sm:w-auto mt-0"
            >
              {isTesting ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Probando conexión...
                </>
              ) : (
                'Probar conexión'
              )}
            </Button>
            
            <Button
              type="submit"
              isDisabled={!testResult?.success || status === 'loading'}
              isLoading={status === 'loading'}
              className="w-full sm:w-auto mt-0"
            >
              {existingIntegration ? 'Actualizar integración' : 'Conectar WhatsApp'}
            </Button>
          </div>
        </form>

    
      </div>
    </Modal>
  );
}
