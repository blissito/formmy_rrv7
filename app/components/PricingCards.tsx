import { Button } from "./Button";
import { cn } from "~/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfecto para empezar con tu website",
    price: "$0",
    priceNote: "/mes",
    button: <Button className="w-full bg-clear text-[#7574D6] font-bold rounded-full py-3 text-lg mt-6">¡Empieza gratis!</Button>,
    arrClass: "text-white underline underline-offset-4 decoration-2 decoration-white",
    includes: [
      "📋 Hasta 3 formularios con respuestas ilimitadas",
      "🎨 Personalización básica de formularios",
      "🤖 Chatbot por 30 días",
    ],
    highlight: true,

    cardClass: "bg-[#7574D6] text-white border-none shadow-xl",
    arrBoxClass: "bg-[#7574D6] text-white",
  },
  {
    name: "Grow",
    description: "Ideal si eres freelancer",
    price: "$140",
    priceNote: "/mes",
    button: <Button className="w-full bg-brand-500 hover:bg-brand-600 text-clear font-bold rounded-full py-3 text-lg mt-6">¡Haz despegar tu proyecto!</Button>,
    arr: "Ahorra 10% al pagar anualmente",
    arrClass: "text-brand-600 underline underline-offset-4 decoration-2 decoration-brand-600",
    includes: [
      "📋 Formularios ilimitados con respuestas ilimitadas",
      "👨‍👩‍👦‍👦 Administración de usuarios",
      "🎨 Personalización avanzada de formularios",
      "🤖 3 Chatbots",
      "👩🏻‍🏫 Acceso a modelos como Gpt, Ollama y Gemini",
      "🪪 100 conversaciones de chat por mes",
    ],
    extra: [
      "$ 199 mxn por cada 100 conversaciones extra",
    ],
    cardClass: "bg-clear text-black border border-outlines",
    arrBoxClass: "bg-[#f6f3ff] text-[#7574D6]",
  },
  {
    name: "Pro ✨",
    description: "Perfecto para negocios",
    price: "$490",
    priceNote: "/mes",
    button: <Button className="w-full bg-bird text-dark hover:bg-brand-600 font-bold rounded-full py-3 text-lg mt-6">¡Hazte imparable con Pro!</Button>,
    arr: "Ahorra 10% al pagar anualmente",
    arrClass: "text-[#DAB23F] underline underline-offset-4 decoration-2 decoration-[#DAB23F]",
    includes: [
        "📋 Todo lo que incluye el plan Grow",
        "🤖 Chatbots ilimitados",
        "🪄 Mayor capacidad de entrenamiento para tu agente",
        "🚀 Integraciones de Calendario, Weebhook, WhatsApp y más ",
        "👩🏻‍🏫 Acceso a los top Models IA como Claude",
        "🪪 250 conversaciones de chat por mes",
     
    ],
    extra: [
      "$ 99 mxn por cada 100 conversaciones extra",
    ],
    cardClass: "bg-clear text-black border border-outlines",
    arrBoxClass: "bg-bird/10 text-[#DAB23F] border-bird",
  },
];

export const PricingCards = () => {
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-stretch">
      {plans.map((plan, idx) => (
        <div
          key={plan.name}
          className={cn(
            "flex flex-col rounded-3xl p-8 w-full md:min-w-[280px] md:max-w-[340px] w-full border transition-all",
            plan.cardClass,
            plan.highlight && "scale-105 z-10 shadow-2xl"
          )}
        >
          <h3 className={cn("text-3xl font-bold mb-2", plan.highlight ? "text-white" : "text-black")}>{plan.name}ww</h3>
          <p className={cn("mb-4 text-lg", plan.highlight ? "text-white/90" : "text-gray-700")}>{plan.description}</p>
          <div className="flex items-end gap-2 mb-4">
            <span className={cn("text-4xl font-bold", plan.highlight ? "text-white" : "text-black")}>{plan.price}</span>
            <span className="font-semibold text-lg">MXN</span>
            <span className={cn("text-lg", plan.highlight ? "text-white/80" : "text-gray-500")}>{plan.priceNote}</span>
          </div>
          {plan.button}
          <div className={cn("mt-6 mb-2 font-semibold", plan.arrClass)}>{plan.arr}</div>
          <div className="mt-2 mb-4">
            <div className="font-bold mb-2">Incluye:</div>
            <ul className="space-y-2">
              {plan.includes.map((inc) => (
                <li key={inc} className="flex items-center gap-2">
                
                  <span className={plan.highlight ? "text-white" : "text-black"}>{inc}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Sección extra solo si existe y tiene contenido */}
          {Array.isArray(plan.extra) && plan.extra.length > 0 && (
            <div className={cn("rounded-xl px-4 py-3 text-sm mt-auto border border-[#e5e5e5]", plan.arrBoxClass)}>
              {plan.extra[0]}<br />{plan.extra[1]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 