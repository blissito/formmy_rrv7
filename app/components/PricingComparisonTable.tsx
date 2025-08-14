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
    "Grow": {
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
      name: "GPT-4", 
      key: "ai_model_gpt4",
      description: "Modelo avanzado de OpenAI",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "GPT-4o", 
      key: "ai_model_gpt4o",
      description: "",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Claude 3.5 Sonnet", 
      key: "ai_model_claude",
      description: "Modelo avanzado de Anthropic",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Claude 3.5 Haiku", 
      key: "ai_model_claude_haiku",
      description: "",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Claude 3 Opus", 
      key: "ai_model_claude_opus",
      description: "",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Gemini 1.5 Pro", 
      key: "ai_model_gemini",
      description: "Modelo avanzado de Google",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Mixtral 8x7B", 
      key: "ai_model_mixtral",
      description: "Modelo de código abierto",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Mistral Large", 
      key: "ai_model_mistral_large",
      description: "",
      isModel: true,
      isSectionHeader: false,
      isIntegration: false
    },
    { 
      name: "Llama 3", 
      key: "ai_model_llama3",
      description: "Modelo de código abierto de Meta",
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
      forms: "3 ",
      chatbots: "1 chat por 30 días",
      training: "1MB ",
      conversations: "50",
      analytics: "-",
      basicModels: "Gpt 4, Mistral, Gemini",
      advancedModels: "-",
      integrations: "-"
    },
    "Grow": {
      price: "$140",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "2",
      training: "2MB ",
      conversations: "100",
      analytics: "-",
      basicModels: "Gpt 4, Mistral, Gemini, Claude Sonet",
      advancedModels: "-",
      integrations: "-"
    },
    "Pro ✨": {
      price: "$490",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "5 ",
      training: "5MB ",
      conversations: "250",
      analytics: "Sentimientos e Intenciones",
      basicModels: "Gpt 4, Mistral, Gemini, Claude Sonet",
      advancedModels: "Claude Haiku",
      integrations: "Calendario, Webhooks, WhatsApp, Instagram, Messenger"
    },
    "Enterprise 🤖": {
      price: "$1,490",
      priceNote: "/mes",
      forms: "Ilimitados",
      chatbots: "Ilimitados",
      training: "25mb",
      conversations: "1,000",
      analytics: "Sentimientos e Intenciones",
      basicModels: "Gpt 4, Mistral, Gemini, Claude Sonet",
      advancedModels: "Claude Haiku",
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

  // AI Models data
  const aiModels = [
    { name: "GPT-4", key: "gpt4" },
    { name: "GPT-4o", key: "gpt4o" },
    { name: "Claude 3.5 Sonnet", key: "claude_sonnet" },
    { name: "Claude 3.5 Haiku", key: "claude_haiku" },
    { name: "Claude 3 Opus", key: "claude_opus" },
    { name: "Gemini 1.5 Pro", key: "gemini" },
    { name: "Mistral Large", key: "mistral_large" },
    { name: "Llama 3", key: "llama3" },
  ];

  // Which plans include which AI models
  const planModelsIncluded: Record<string, Record<string, boolean>> = {
    "Free": {
      gpt4: true,
      gpt4o: false,
      claude_sonnet: false,
      claude_haiku: false,
      claude_opus: false,
      gemini: true,
      mistral_large: true,
      llama3: false,
    },
    "Grow": {
      gpt4: true,
      gpt4o: true,
      claude_sonnet: true,
      claude_haiku: false,
      claude_opus: false,
      gemini: true,
      mistral_large: true,
      llama3: true,
    },
    "Pro ✨": {
      gpt4: true,
      gpt4o: true,
      claude_sonnet: true,
      claude_haiku: true,
      claude_opus: false,
      gemini: true,
      mistral_large: true,
      llama3: true,
    },
    "Enterprise 🤖": {
      gpt4: true,
      gpt4o: true,
      claude_sonnet: true,
      claude_haiku: true,
      claude_opus: true,
      gemini: true,
      mistral_large: true,
      llama3: true,
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
