import type { Plan } from "./PricingCards";
import { plans } from "./PricingCards";

interface Feature {
  name: string;
  key: string;
  description: string;
  isSectionHeader?: boolean;
  isModel?: boolean;
  isIntegration?: boolean;
}

interface PlanWithFeatures extends Plan {
  forms: string;
  chatbots: string;
  training: string;
  conversations: string;
  analytics: string;
  basicModels: string;
  advancedModels: string;
  integrations: string;
}

export function PricingComparisonTable() {
  // Plan color themes
  const planColors = {
    "Free": {
      bg: "bg-transparent",
      border: "border-brand-200",
      text: "text-dark",
      accent: "bg-brand-500"
    },
    "Starter": {
      bg: "bg-brand-500",
      border: "border-brand-500",
      text: "text-dark",
      accent: "bg-brand-500"
    },
    "Pro ✨": {
      bg: "bg-bird",
      border: "border-bird",
      text: "text-dark",
      accent: "bg-bird"
    },
    "Enterprise 🤖": {
      bg: "bg-cloud",
      border: "border-cloud",
      text: "text-dark",
      accent: "bg-cloud"
    }
  };

  // Define integrations data
  const integrations = [
    { name: "Deník Calendario ", key: "denik" },
    { name: "WhatsApp ", key: "whatsapp" },
    { name: "Google Calendar ", key: "calendar" },
    { name: "Gmail (Proximamente)", key: "gmail" },
    { name: "Messenger (Proximamente)", key: "messenger" },
    { name: "Instagram (Proximamente)", key: "instagram" },
    { name: "Webhooks (Proximamente)", key: "webhooks" },
  ];

  // Which plans include which integrations
  const planIntegrationsIncluded: Record<string, Record<string, boolean>> = {
    "Free": {
      denik: false,
      calendar: false,
      gmail: false,
      whatsapp: false,
      messenger: false,
      webhooks: false,
      instagram: false,
    },
    "Starter": {
      denik: true,
      calendar: false,
      gmail: false,
      whatsapp: false,
      messenger: false,
      webhooks: false,
      instagram: false,
    },
    "Pro ✨": {
      denik: true,
      calendar: true,
      gmail: true,
      whatsapp: true,
      messenger: true,
      webhooks: false,
      instagram: true,
    },
    "Enterprise 🤖": {
      denik: true,
      calendar: true,
      gmail: true,
      whatsapp: true,
      messenger: true,
      webhooks: true,
      instagram: true,
    },
  };

  const features: Feature[] = [
    // Precio
    { 
      name: "Precio", 
      key: "price",
      description: "Inversión mensual por el plan",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    // Configuración Section
    { 
      name: "Configuración", 
      key: "config_header",
      description: "Ajustes básicos de tu cuenta",
      isSectionHeader: true,
      isModel: false,
      isIntegration: false
    },
    { 
      name: "Formularios", 
      key: "forms",
      description: "Cantidad de formularios incluidos",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    { 
      name: "Chatbots/ Agentes", 
      key: "chatbots",
      description: "Número de asistentes de IA incluidos",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    { 
      name: "Capacidad de entrenamiento", 
      key: "training",
      description: "Espacio para documentos de entrenamiento por agente",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    { 
      name: "Conversaciones/mes", 
      key: "conversations",
      description: "Límite mensual de interacciones",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    { 
      name: "Analytics (Proximamente)", 
      key: "analytics",
      description: "Análisis de tus conversaciones",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    
    // Modelos Section
    { 
      name: "Modelos de IA", 
      key: "ai_models_header",
      description: "Modelos de inteligencia artificial disponibles",
      isSectionHeader: true,
      isModel: false,
      isIntegration: false
    },
    { 
      name: "Gemini 2.5 Flash-Lite", 
      key: "ai_model_gemini_flashlite",
      description: "Modelo económico Google",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "GPT-5 Nano", 
      key: "ai_model_gpt5_nano",
      description: "Modelo económico de última generación",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "GPT-5 Mini", 
      key: "ai_model_gpt5_mini",
      description: "Modelo premium OpenAI",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Claude 3 Haiku", 
      key: "ai_model_claude3_haiku",
      description: "Modelo económico Anthropic",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Claude 3.5 Haiku", 
      key: "ai_model_claude35_haiku",
      description: "Modelo avanzado Anthropic",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Integraciones", 
      key: "integrations_header",
      description: "Conexiones con otras plataformas",
      isSectionHeader: true,
      isModel: false,
      isIntegration: false
    },
    // Agregar cada integración individualmente
    ...integrations.map(integration => ({
      name: integration.name,
      key: `integration_${integration.key}`,
      description: `Integración con ${integration.name}`,
      isIntegration: true,
      isSectionHeader: false,
      isModel: false
    })),
  ];

  // Custom plan features data
  const planFeatures: Record<string, Record<string, string>> = {
    "Free": {
      price: "$0",
      priceNote: "/mes",
      forms: "3",
      chatbots: "0 (trial 60 días)",
      training: "1MB",
      conversations: "0 (trial 60 días)",
      analytics: "-",
      basicModels: "-",
      advancedModels: "-",
      integrations: "-"
    },
    "Starter": {
      price: "$149",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "1",
      training: "0 MB",
      conversations: "50",
      analytics: "-",
      basicModels: "GPT-5 Nano, Gemini 2.5 Flash-Lite",
      advancedModels: "-",
      integrations: "-"
    },
    "Pro ✨": {
      price: "$499",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "10",
      training: "50MB RAG",
      conversations: "250",
      analytics: "Sentimientos e Intenciones",
      basicModels: "Claude 3 Haiku",
      advancedModels: "-",
      integrations: "Calendario, Webhooks, WhatsApp, Instagram, Messenger"
    },
    "Enterprise 🤖": {
      price: "$2,490",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "Ilimitados",
      training: "Ilimitado",
      conversations: "1,000",
      analytics: "Sentimientos e Intenciones",
      basicModels: "GPT-5 Mini, Claude 3.5 Haiku",
      advancedModels: "-",
      integrations: "Calendario, Webhooks, WhatsApp, Instagram, Messenger"
    }
  };

  // Map the plans with only custom features
  const planData: PlanWithFeatures[] = plans.map((plan: Plan) => {
    // Get the custom features for this plan
    const customFeatures = planFeatures[plan.name] || {};
    
    // Create the plan with only the custom features
    return {
      ...plan,
      ...customFeatures,
      // Use custom features or empty string if not defined
      forms: customFeatures.forms || "",
      chatbots: customFeatures.chatbots || "",
      training: customFeatures.training || "",
      conversations: customFeatures.conversations || "",
      analytics: customFeatures.analytics || "",
      basicModels: customFeatures.basicModels || "",
      advancedModels: customFeatures.advancedModels || "",
      integrations: customFeatures.integrations || "",
    };
  });

  // Which plans include which AI models - configuración actual
  const planModelsIncluded: Record<string, Record<string, boolean>> = {
    "Free": {
      gemini_flashlite: false,
      gpt5_nano: false,
      gpt5_mini: false,
      claude3_haiku: false,
      claude35_haiku: false,
    },
    "Starter": {
      gemini_flashlite: true,
      gpt5_nano: true,
      gpt5_mini: false,
      claude3_haiku: false,
      claude35_haiku: false,
    },
    "Pro ✨": {
      gemini_flashlite: true,
      gpt5_nano: true,
      gpt5_mini: false,
      claude3_haiku: true,
      claude35_haiku: false,
    },
    "Enterprise 🤖": {
      gemini_flashlite: true,
      gpt5_nano: true,
      gpt5_mini: true,
      claude3_haiku: true,
      claude35_haiku: true,
    },
  };

  return (
    <div className="max-w-7xl mx-auto my-20 md:my-40 px-4">
      <div className="text-center mb-16">
        <h2 className="lg:text-6xl md:text-4xl text-3xl font-bold text-dark mb-4">Compara los Planes</h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">Encuentra el plan perfecto para tu negocio y compara todas las características incluidas</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[800px] md:min-w-full border-collapse bg-white rounded-3xl shadow-sm">
          <colgroup>
            <col className="w-[250px] md:w-1/3" />
            <col className="w-[150px] md:w-1/6" />
            <col className="w-[150px] md:w-1/6" />
            <col className="w-[150px] md:w-1/6" />
            <col className="w-[150px] md:w-1/6" />
          </colgroup>
        <thead>
          <tr className="bg-white border-b border-outlines/50" >
            <th className="p-6 text-left w-1/3 bg-white"></th>
            {planData.map((plan, index) => {
              const badgeColors = {
                "Free": "bg-gray-100 text-gray-700",
                "Starter": "bg-yellow-100 text-yellow-700",
                "Pro ✨": "bg-brand-100 text-brand-700",
                "Enterprise 🤖": "bg-cloud/20 text-cloud"
              };

              return (
                <th key={plan.name} className="p-6 text-center w-1/6">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${badgeColors[plan.name as keyof typeof badgeColors]}`}>
                    {plan.name}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => {
            // Handle section headers
            if (feature.isSectionHeader) {
              return (
                <tr key={feature.key} className="border-t border-outlines/50">
                  <td colSpan={planData.length + 1} className="p-6 pt-12 pb-6">
                    <div className="font-bold text-3xl text-gray-900 heading ">{feature.name}</div>
                  </td>
                </tr>
              );
            }

            // Handle AI models and integrations with checkmarks
            if (feature.isModel || feature.isIntegration) {
              const modelKey = feature.key.replace('ai_model_', '').replace('integration_', '');
              return (
                <tr key={feature.key} className="border-t border-outlines/50">
                  <td className="p-5 py-4">
                    <div className="font-normal text-sm text-dark heading">
                      {feature.name}
                    </div>
                  </td>
                  {planData.map((plan) => {
                    const isIncluded = feature.isModel
                      ? planModelsIncluded[plan.name]?.[modelKey]
                      : planIntegrationsIncluded[plan.name]?.[modelKey];

                    const checkColors = {
                      "Free": "text-gray-500",
                      "Starter": "text-yellow-600",
                      "Pro ✨": "text-brand-600",
                      "Enterprise 🤖": "text-cloud"
                    };

                    return (
                      <td key={`${plan.name}-${feature.key}`} className="p-5 py-4 text-center">
                        {isIncluded ? (
                          <svg className={`w-6 h-6 mx-auto ${checkColors[plan.name as keyof typeof checkColors]}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            }

            // Handle regular features
            return (
              <tr key={feature.key} className="border-t border-outlines/50">
                <td className="p-5 py-4">
                  <div className="font-medium text-sm text-dark heading">{feature.name}</div>
                  {feature.description && (
                    <div className="text-xs text-irongray mt-1">{feature.description}</div>
                  )}
                </td>
                {planData.map((plan) => {
                  const value = feature.key === 'price'
                    ? `${plan.price}${plan.priceNote}`
                    : plan[feature.key as keyof typeof plan] || '—';

                  const cleanValue = (val: any) => {
                    if (!val || val === '—') return null;
                    return typeof val === 'string'
                      ? val.replace('📋', '').replace('🤖', '').trim()
                      : val;
                  };

                  const displayValue = cleanValue(value);
                  const isPrice = feature.key === 'price';

                  return (
                    <td key={`${plan.name}-${feature.key}`} className="p-5 py-4 text-center">
                      {displayValue ? (
                        <div className={`${
                          isPrice ? 'text-gray-900 text-xl font-bold' : 'text-gray-700 text-base font-medium'
                        }`}>
                          {displayValue}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-sm">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};
