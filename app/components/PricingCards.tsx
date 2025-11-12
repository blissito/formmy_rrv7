import { useFetcher } from "react-router";
import { Button } from "./Button";
import { cn } from "~/lib/utils";
import Spinner from "./Spinner";

export interface Plan {
  name: string;
  description: string;
  price: string;
  priceNote: string;
  buttonText: string;
  buttonAction?: string;
  intent?: string;
  arr?: string;
  arrClass?: string;
  includes: string[];
  extra?: string[];
  cardClass?: string;
  arrBoxClass?: string;
  highlight?: boolean;
}

export const plans: Plan[] = [
  {
    name: "Free",
    description: "Perfecto para empezar",
    price: "$0",
    priceNote: "/mes",
    buttonText: "¡Empieza gratis!",
    buttonAction: "/api/login",
    intent: "google-login",
    arrClass: "text-white underline underline-offset-4 decoration-2 decoration-white",
    includes: [
      "📋 Hasta 3 formularios con respuestas ilimitadas",
      "🎨 Personalización básica de formularios",
      "🤖 Chatbot por 60 días",
    ],
    highlight: true,
    cardClass: "bg-[#7574D6] text-white border-none shadow-xl",
    arrBoxClass: "bg-[#7574D6] text-white",
    
  },
  {
    name: "Starter",
    description: "La opción entrepreneur",
    price: "$149",
    priceNote: "/mes",
    buttonText: "¡Empieza ahora!",
    buttonAction: "/api/stripe",
    intent: "starter_plan",
    arr: "Ahorra 10% al pagar anualmente",
    arrClass: "text-[#DAB23F] underline underline-offset-4 decoration-2 decoration-[#DAB23F]",
    includes: [
      "📋 Formularios ilimitados",
      "👨‍👩‍👦‍👦 Administración básica de usuarios",
      "🎨 Personalización avanzada de formularios",
      "🤖 1 chatbot",
      "👩🏻‍🏫 Modelos IA última generación (GPT-5 Nano, Gemini 2.5)",
      "🪪 50 conversaciones/mes",
    ],
    extra: [
      "¡$149 MXN por cada 100 conversaciones extra!",
    ],
    cardClass: "bg-clear text-black border border-outlines",
    arrBoxClass: "bg-amber-300/20 text-[#C79D26]",

  },
  {
    name: "Pro ✨",
    description: "El plan más completo",
    price: "$499",
    priceNote: "/mes",
    buttonText: "¡Hazte imparable con Pro!",
    buttonAction: "/api/stripe",
    intent: "pro_plan",
    arr: "Ahorra 15% al pagar anualmente",
    arrClass: "text-brand-600 underline underline-offset-4 decoration-2 decoration-brand-600",
    includes: [
        "📋 Todo lo que incluye el plan Starter",
        "🤖 10 chatbots",
        "🪄 50MB de contexto RAG por chatbot",
        "🚀 Integraciones premium",
        "👩🏻‍🏫 Claude 3 Haiku premium - Calidad Anthropic",
        "🪪 250 conversaciones",
        // "🎤 30 minutos de voz IA/mes",
        "⚡ Respuestas 3x más rápidas",
    ],
    extra: [
      "¡$99 MXN por cada 100 conversaciones extra!",
    ],
    cardClass: "bg-gradient-to-br from-yellow-50 to-orange-50 text-black border-2 border-yellow-400 shadow-xl",
    highlight: true,
    arrBoxClass: "bg-brand-600/10 text-[#7574D6]",

  },
  {
    name: "Enterprise 🤖",
    description: "Solución corporativa",
    price: "$2,490",
    priceNote: "/mes",
    buttonText: "¡Potencia total!",
    buttonAction: "/api/stripe",
    intent: "enterprise_plan",
    arr: "Ahorra 15% al pagar anualmente",
    arrClass: "text-[#5FAFA8] underline underline-offset-4 decoration-2 decoration-[#5FAFA8]",
    includes: [
        "📋 Todo lo que incluye el plan Starter",
        "🤖 Chatbots ILIMITADOS",
        "🪄 Contexto RAG ilimitado por chatbot",
        "🚀 Integraciones enterprise",
        "👩🏻‍🏫 GPT-5 Mini + Claude 3.5 Haiku",
        "📊 Dashboard de analytics profesional",
        "🪪 2,500 conversaciones",
        // "🎤 60 minutos de voz IA/mes",
        "🎧 Soporte prioritario",
    ],
    extra: [
      "¡$59 MXN por cada 100 conversaciones extra!",
    ],
    cardClass: "bg-clear text-black border border-outlines",
    arrBoxClass: "bg-cloud/10 text-[#5FAFA8] border-cloud",
  },
];

const PricingCard = ({ plan }: { plan: Plan }) => {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const handleClick = () => {
    if (plan.buttonAction && plan.intent) {
      // For google-login (free plan), clear any saved plan intent
      if (plan.intent === 'google-login') {
        localStorage.removeItem('formmy_plan_intent');
        console.log('[PricingCards] Cleared plan intent - user clicking free plan');
      }
      // For paid plans, save intent to localStorage before redirect
      else if (plan.intent.includes('_plan') && plan.buttonAction === '/api/stripe') {
        const intentData = {
          intent: plan.intent,
          timestamp: Date.now(), // Save timestamp to expire old intents
        };
        localStorage.setItem('formmy_plan_intent', JSON.stringify(intentData));
        console.log('[PricingCards] Saved plan intent to localStorage:', plan.intent);
      }

      fetcher.submit(
        { intent: plan.intent },
        { method: "post", action: plan.buttonAction }
      );
    }
  };

  // Determinar colores del badge según el plan
  const badgeColors = {
    "Free": "bg-gray-100 text-gray-800",
    "Starter": "bg-yellow-100 text-yellow-800",
    "Pro ✨": "bg-brand-100 text-[#6463A3]",
    "Enterprise 🤖": "bg-cloud/20 text-teal-800"
  };

  const buttonColors = {
    "Free": "bg-gray-200 hover:bg-gray-300 text-gray-800",
    "Starter": "bg-yellow-300 hover:bg-yellow-400 text-gray-900",
    "Pro ✨": "bg-brand-500 hover:bg-brand-600 text-dark",
    "Enterprise 🤖": "bg-cloud hover:bg-cloud/90 text-dark"
  };

  const hoverBgColors = {
    "Free": "hover:bg-gray-500/5",
    "Starter": "hover:bg-yellow-500/10",
    "Pro ✨": "hover:bg-brand-500/10",
    "Enterprise 🤖": "hover:bg-cloud/10"
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl p-6 w-full md:min-w-[280px] md:max-w-[320px] bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300",
        plan.highlight && "shadow-lg",
        hoverBgColors[plan.name as keyof typeof hoverBgColors]
      )}
    >
      {/* Badge del plan */}
      <div className="flex items-center gap-2 mb-6">
        <span className={cn("px-4 py-2 rounded-full text-sm font-semibold", badgeColors[plan.name as keyof typeof badgeColors])}>
          {plan.name}
        </span>
        {plan.highlight && plan.name === "Pro ✨" && (
          <span className="text-brand-600 text-sm font-semibold">✨ Más popular</span>
        )}
      </div>

      {/* Precio */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
          <span className="text-gray-500 text-sm">{plan.priceNote}</span>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-gray-600 mb-1">{plan.description}</p>
    

      {/* Botón */}
      <Button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "w-full font-semibold rounded-full py-3 mb-4",
          buttonColors[plan.name as keyof typeof buttonColors]
        )}
      >
        {isLoading ? <Spinner /> : plan.buttonText}
      </Button>
      <p className={cn("mt-3 text-xs mb-4", plan.arrClass)}>{plan.arr}</p>
      {/* Lista de features */}
      <ul className="space-y-3 mb-3">
        {plan.includes.map((feature) => {
          // Extraer emoji y texto - buscar hasta el primer espacio después de caracteres especiales
          const parts = feature.trim().split(/\s+/);
          const emoji = parts[0]; // Primer elemento (emoji)
          const text = parts.slice(1).join(' '); // Resto del texto

          return (
            <li key={feature} className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0 self-start">{emoji}</span>
              <span className="text-gray-700 text-sm">{text}</span>
            </li>
          );
        })}
      </ul>
      <div className={cn("mt-auto px-2 rounded-xl", plan.arrBoxClass)}>
        {plan.extra && (
          <p className="mt-3 text-xs mb-4">{plan.extra}</p>
        )}
      </div>
    </div>
  );
};

export const PricingCards = () => {
  return (
    <div className="w-full flex flex-wrap justify-center gap-4">
      {plans.map((plan) => (
        <PricingCard key={plan.name} plan={plan} />
      ))}
    </div>
  );
}; 