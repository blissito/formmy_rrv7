import { useState, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Button } from "~/components/Button";
import Modal from "~/components/Modal";

interface StripeIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (integration: any) => void;
  chatbotId: string;
  existingIntegration?: {
    id: string;
    stripeApiKey?: string;
    stripePublishableKey?: string;
    stripeWebhookSecret?: string;
    isActive: boolean;
  } | null;
}

export default function StripeIntegrationModal({
  isOpen,
  onClose,
  onSuccess,
  chatbotId,
  existingIntegration,
}: StripeIntegrationModalProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const isLoading = fetcher.state === "submitting";
  
  // Debug fetcher state changes
  useEffect(() => {
    console.log("🔍 Debug Modal - Fetcher state changed:", fetcher.state);
  }, [fetcher.state]);
  
  // Cerrar modal cuando la integración se crea exitosamente
  useEffect(() => {
    console.log("🔍 Debug Modal - fetcher.data:", fetcher.data);
    console.log("🔍 Debug Modal - fetcher.state:", fetcher.state);
    
    if (fetcher.data?.success && fetcher.state === "idle") {
      console.log("✅ Debug Modal - Integración exitosa, llamando onSuccess");
      console.log("🔍 Debug Modal - Integration data:", fetcher.data.integration);
      
      // Llamar al handler de éxito primero (esto actualiza el estado local)
      if (onSuccess) {
        onSuccess(fetcher.data.integration);
      } else {
        // Fallback: solo cerrar modal
        console.log("⚠️ Debug Modal - No hay onSuccess handler, cerrando modal");
        onClose();
      }
      
      // Revalidar después de un pequeño delay para permitir que el estado local se actualice primero
      setTimeout(() => {
        revalidator.revalidate();
      }, 100);
      
    } else if (fetcher.data?.error) {
      console.error("❌ Debug Modal - Error:", fetcher.data.error);
    }
  }, [fetcher.data, fetcher.state, onClose, onSuccess, revalidator]);

  const [formData, setFormData] = useState({
    stripeApiKey: existingIntegration?.stripeApiKey || "",
    stripePublishableKey: existingIntegration?.stripePublishableKey || "",
    stripeWebhookSecret: existingIntegration?.stripeWebhookSecret || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log("🔍 Debug Modal - Form submit triggered");
    console.log("🔍 Debug Modal - Form data:", formData);
    // No prevenir default - dejar que fetcher.Form lo maneje
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title={existingIntegration ? "Configurar Stripe" : "Conectar Stripe"}
     
    >
      <div className="space-y-6 mt-8 min-w-[480px]">

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/assets/chat/stripe.png" 
              alt="Stripe" 
              className="w-8 h-8"
            />
            <div>
              <h3 className=" text-metal">Stripe</h3>
              <p className="text-sm text-metal">
                Genera links de pago automáticamente
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h4 className=" text-metal mb-2">💡 Cómo obtener las claves</h4>
          <ol className="text-sm text-metal space-y-1">
            <li>1. Ve a tu dashboard de Stripe</li>
            <li>2. En el menú lateral, busca "Developers" → "API keys"</li>
            <li>3. Copia tu "Secret key" (requerida)</li>
            <li>4. Opcionalmente copia tu "Publishable key"</li>
          </ol>
          <p className="text-xs text-metal mt-2">
            ⚠️ Usa claves de prueba (test) mientras desarrollas
          </p>
        </div>
        <fetcher.Form method="post" action="/api/v1/chatbot" onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="intent" value={existingIntegration ? "update_integration" : "create_integration"} />
          <input type="hidden" name="chatbotId" value={chatbotId} />
          <input type="hidden" name="platform" value="STRIPE" />
          {existingIntegration && (
            <input type="hidden" name="integrationId" value={existingIntegration.id} />
          )}

          <div>
            <label className="block text-sm  text-metal mb-2">
              Secret Key (Requerida)
            </label>
            <input
              type="password"
              name="stripeApiKey"
              value={formData.stripeApiKey}
              onChange={(e) => handleInputChange("stripeApiKey", e.target.value)}
              placeholder="sk_test_..."
              className="w-full text-dark px-3 h-12 border border-outlines rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-irongray mt-1">
              Tu clave secreta de Stripe (comienza con sk_)
            </p>
          </div>

          <div>
            <label className="block text-sm  text-metal mb-2">
              Publishable Key (Opcional)
            </label>
            <input
              type="text"
              name="stripePublishableKey"
              value={formData.stripePublishableKey}
              onChange={(e) => handleInputChange("stripePublishableKey", e.target.value)}
              placeholder="pk_test_..."
              className="w-full text-dark px-3 h-12 border border-outlines rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="text-xs text-irongray mt-1">
              Tu clave pública de Stripe (comienza con pk_)
            </p>
          </div>

          <div>
            <label className="block text-sm  text-metal mb-2">
              Webhook Secret (Opcional)
            </label>
            <input
              type="password"
              name="stripeWebhookSecret"
              value={formData.stripeWebhookSecret}
              onChange={(e) => handleInputChange("stripeWebhookSecret", e.target.value)}
              placeholder="whsec_..."
              className="w-full text-dark px-3 h-12 border border-outlines rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="text-xs text-irongray mt-1">
              Para validar webhooks de Stripe (comienza con whsec_)
            </p>
          </div>

          {fetcher.data?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{fetcher.data.error}</p>
            </div>
          )}

          <div className="flex w-full justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="mx-0 mt-0"
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="mx-0 mt-0"
              isDisabled={isLoading || !formData.stripeApiKey}
              isLoading={isLoading}
            >
              {existingIntegration ? "Actualizar" : "Conectar"}
            </Button>
          </div>
        </fetcher.Form>

       
      </div>
    </Modal>
  );
}