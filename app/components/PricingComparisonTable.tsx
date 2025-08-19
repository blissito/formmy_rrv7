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
  basicModels: string;
  advancedModels: string;
  integrations: string;
}

export function PricingComparisonTable() {
  // Define the features to compare with custom text
  // Define integrations data
  const integrations = [
    { name: "Google Calendar", key: "calendar" },
    { name: "WhatsApp", key: "whatsapp" },
    { name: "Messenger", key: "messenger" },
    { name: "Instagram", key: "instagram" },
    { name: "Slack", key: "slack" },
    { name: "Shopify", key: "shopify" },
    { name: "Wordpress", key: "wordpress" },
    { name: "Webhooks", key: "webhooks" },
  ];

  // Which plans include which integrations
  const planIntegrationsIncluded: Record<string, Record<string, boolean>> = {
    "Free": {
      calendar: false,
      whatsapp: false,
      messenger: false,
      webhooks: false,
      instagram: false,
      slack: false,
      shopify: false,
    },
    "Starter": {
      calendar: false,
      whatsapp: false,
      messenger: false,
      webhooks: false,
      instagram: false,
      slack: false,
      shopify: false,
    },
    "Pro ✨": {
      calendar: true,
      whatsapp: true,
      messenger: true,
      webhooks: false,
      instagram: true,
      slack: true,
      shopify: true,
      wordpress: true,
    },
    "Enterprise 🤖": {
      calendar: true,
      whatsapp: true,
      messenger: true,
      webhooks: true,
      instagram: true,
      slack: true,
      shopify: true,
      wordpress: true,
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
      name: "CONFIGURACIÓN", 
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
      name: "Analytics", 
      key: "analytics",
      description: "Análisis de tus conversaciones",
      isSectionHeader: false,
      isModel: false,
      isIntegration: false
    },
    
    // Modelos Section
    { 
      name: "MODELOS DE IA", 
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
      name: "INTEGRACIONES", 
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
      chatbots: "2",
      training: "2MB ",
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
      training: "5MB ",
      conversations: "250",
      analytics: "Sentimientos e Intenciones",
      basicModels: "Claude 3 Haiku",
      advancedModels: "-",
      integrations: "Calendario, Webhooks, WhatsApp, Instagram, Messenger"
    },
    "Enterprise 🤖": {
      price: "$1,499",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "Ilimitados",
      training: "10MB",
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
      models: customFeatures.models || "",
      integrations: customFeatures.integrations || "",
    };
  });

  // AI Models data - modelos actuales 2025 agrupados por proveedor
  const aiModels = [
    { name: "Gemini 2.5 Flash-Lite", key: "gemini_flashlite" },
    { name: "GPT-5 Nano", key: "gpt5_nano" },
    { name: "GPT-5 Mini", key: "gpt5_mini" },
    { name: "Claude 3 Haiku", key: "claude3_haiku" },
    { name: "Claude 3.5 Haiku", key: "claude35_haiku" },
  ];

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
      <h2 className="lg:text-6xl md:text-4xl text-3xl font-bold text-center mb-8">Compara los Planes</h2>

      <div className="overflow-x-auto">
        <table className="min-w-[800px] md:min-w-full border-collapse">
          <colgroup>
            <col className="w-[250px] md:w-1/3" />
            <col className="w-[150px] md:w-1/6" />
            <col className="w-[150px] md:w-1/6" />
            <col className="w-[150px] md:w-1/6" />
            <col className="w-[150px] md:w-1/6" />
          </colgroup>
        <thead>
          <tr>
            <th className="p-4 text-left border-b border-outlines w-1/3">
              <div className="font-bold text-lg">Características</div>
              <div className="text-sm text-metal">Compara lo que incluye cada plan</div>
            </th>
            {planData.map((plan) => (
              <th key={plan.name} className="p-4 text-center border-b border-outlines w-1/6">
                <div className="font-bold text-xl mb-1 whitespace-nowrap">{plan.name}</div>
                <div className="text-sm text-metal">{plan.description}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => {
            // Handle section headers
            if (feature.isSectionHeader) {
              return (
                <tr key={feature.key} className="bg-brand-100/80">
                  <td colSpan={planData.length + 1} className="p-3 ">
                    <div className="font-bold text-xl">{feature.name}</div>
                    {feature.description && (
                      <div className="text-base text-metal">{feature.description}</div>
                    )}
                  </td>
                </tr>
              );
            }

            // Handle AI models and integrations with checkmarks
            if (feature.isModel || feature.isIntegration) {
              const modelKey = feature.key.replace('ai_model_', '').replace('integration_', '');
              return (
                <tr key={feature.key} className={`${feature.isModel ? '' : ''}`}>
                  <td className="p-4 border-b border-outlines">
                    <div className={`font-medium text-lg ${feature.isModel ? 'pl-0' : ''}`}>
              {feature.name}
                    </div>
                  </td>
                  {planData.map((plan) => {
                    const isIncluded = feature.isModel 
                      ? planModelsIncluded[plan.name]?.[modelKey]
                      : planIntegrationsIncluded[plan.name]?.[modelKey];
                    
                    return (
                      <td key={`${plan.name}-${feature.key}`} className="p-4 text-center border-b border-outlines">
                        {isIncluded ? (
                          <span className="inline-flex w-6 h-6 bg-brand-500 rounded-full items-center justify-center text-white mx-auto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="text-dark">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            }

            // Handle regular features
            return (
              <tr key={feature.key} className="hover:bg-gray-50">
                <td className="p-4 border-b border-outlines">
                  <div className="font-medium text-lg">{feature.name}</div>
                  {feature.description && (
                    <div className="text-sm text-irongray">{feature.description}</div>
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
                  
                  return (
                    <td key={`${plan.name}-${feature.key}`} className="p-4 text-center border-b border-outlines">
                      {displayValue ? (
                        <div className="font-medium text-base md:text-xl">
                          {displayValue}
                        </div>
                      ) : (
                        <div className="h-6"></div>
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
