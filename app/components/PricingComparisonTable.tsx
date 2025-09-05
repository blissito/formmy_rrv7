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
    { name: "Google Calendar ", key: "calendar" },
    { name: "WhatsApp ", key: "whatsapp" },
    { name: "Messenger (Proximamente)", key: "messenger" },
    { name: "Instagram (Proximamente)", key: "instagram" },
    // { name: "Slack (Proximamente)", key: "slack" },
    { name: "Shopify (Proximamente)", key: "shopify" },
    { name: "Wordpress (Proximamente)", key: "wordpress" },
    { name: "Webhooks (Proximamente)", key: "webhooks" },
  ];

  // Which plans include which integrations
  const planIntegrationsIncluded: Record<string, Record<string, boolean>> = {
    "Free": {
      denik: false,
      calendar: false,
      whatsapp: false,
      messenger: false,
      webhooks: false,
      instagram: false,
      slack: false,
      shopify: false,
    },
    "Starter": {
      denik: true,
      calendar: false,
      whatsapp: false,
      messenger: false,
      webhooks: false,
      instagram: false,
      slack: false,
      shopify: false,
    },
    "Pro ✨": {
      denik: true,
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
      denik: true,
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
      <div className="text-center mb-12">
        <h2 className="lg:text-6xl md:text-4xl text-3xl font-bold text-dark mb-4">Compara los Planes</h2>
        <p className="text-lg text-metal max-w-2xl mx-auto">Encuentra el plan perfecto para tu negocio y compara todas las características incluidas</p>
      </div>

      <div className="overflow-x-auto shadow rounded-2xl border border-outlines bg-white">
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
            <th className="p-4 text-left border-b border-outlines w-1/3 bg-white">
              <div className="font-bold text-lg">Características</div>
              <div className="text-sm text-metal">Compara lo que incluye cada plan</div>
            </th>
            {planData.map((plan) => {
              const colors = planColors[plan.name as keyof typeof planColors];
              return (
                <th key={plan.name} className={`p-4 text-center border-b ${colors.border} w-1/6 ${colors.bg} transition-all duration-200`}>
                  <div className={`font-bold text-xl mb-1 whitespace-nowrap ${colors.text}`}>{plan.name}</div>
                  <div className={`text-sm ${colors.text} opacity-70 font-regular`}>{plan.description}</div>
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
                <tr key={feature.key} className="bg-dark/5">
                  <td colSpan={planData.length + 1} className="p-4">
                    <div className="font-bold text-xl text-dark">{feature.name}</div>
                    {feature.description && (
                      <div className="text-base text-metal mt-1 ">{feature.description}</div>
                    )}
                  </td>
                </tr>
              );
            }

            // Handle AI models and integrations with checkmarks
            if (feature.isModel || feature.isIntegration) {
              const modelKey = feature.key.replace('ai_model_', '').replace('integration_', '');
              return (
                <tr key={feature.key} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="p-4 border-b border-outlines bg-white">
                    <div className="font-medium text-lg">
                      {feature.name}
                    </div>
                    <div className="text-sm text-irongray mt-1">{feature.description}</div>
                  </td>
                  {planData.map((plan) => {
                    const colors = planColors[plan.name as keyof typeof planColors];
                    const isIncluded = feature.isModel 
                      ? planModelsIncluded[plan.name]?.[modelKey]
                      : planIntegrationsIncluded[plan.name]?.[modelKey];
                    
                    return (
                      <td key={`${plan.name}-${feature.key}`} className={`p-4 text-center border-b ${colors.border} ${colors.bg}/30 transition-all duration-150`}>
                        {isIncluded ? (
                          <span className={`inline-flex w-7 h-7 ${colors.accent} rounded-full items-center justify-center text-white mx-auto shadow-sm`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            }

            // Handle regular features
            return (
              <tr key={feature.key} className="hover:bg-gray-50/50 transition-colors duration-150">
                <td className="p-4 border-b border-outlines bg-white">
                  <div className="font-medium text-lg">{feature.name}</div>
                  {feature.description && (
                    <div className="text-sm text-irongray mt-1">{feature.description}</div>
                  )}
                </td>
                {planData.map((plan) => {
                  const colors = planColors[plan.name as keyof typeof planColors];
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
                    <td key={`${plan.name}-${feature.key}`} className={`p-4 text-center border-b ${colors.border} ${colors.bg}/30 transition-all duration-150`}>
                      {displayValue ? (
                        <div className={`font-semibold text-base md:text-xl ${
                          isPrice ? `${colors.text} text-2xl md:text-3xl` : colors.text
                        }`}>
                          {displayValue}
                        </div>
                      ) : (
                        <div className="text-gray-400 font-medium">—</div>
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
