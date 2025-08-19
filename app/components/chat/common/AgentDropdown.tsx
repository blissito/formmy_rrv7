import { IconDropdown, type DropdownOption } from "./IconDropdown";

// Tipos de agentes disponibles
export type AgentType =
  | "sales"
  | "customer_support"
  | "content_seo"
  | "data_analyst"
  | "automation_ai"
  | "growth_hacker";

// Opciones de agentes predefinidas
const AGENT_OPTIONS: DropdownOption[] = [
  {
    value: "sales",
    label: "Agente de Ventas",
    description: "Experto en ventas consultivas B2B/B2C",
    iconSrc: "/assets/chat/agents/sales.svg",
  },
  {
    value: "customer_support",
    label: "Soporte al Cliente",
    description: "Customer success y resolución rápida",
    iconSrc: "/assets/chat/agents/customer-service.svg",
  },
  {
    value: "content_seo",
    label: "Contenido y SEO",
    description: "Estratega de contenido y posicionamiento",
    iconSrc: "/assets/chat/agents/content.svg",
  },
  {
    value: "data_analyst",
    label: "Analista de Datos",
    description: "Insights y visualización de métricas",
    iconSrc: "/assets/chat/agents/analytics.svg",
  },
  {
    value: "automation_ai",
    label: "Automatización e IA",
    description: "Workflows inteligentes y procesos RPA",
    iconSrc: "/assets/chat/agents/automation.svg",
  },
  {
    value: "growth_hacker",
    label: "Growth Hacker",
    description: "Crecimiento viral y experimentación",
    iconSrc: "/assets/chat/agents/growth.svg",
  },
];

type AgentDropdownProps = {
  selectedAgent: AgentType;
  onChange: (agent: AgentType) => void;
  className?: string;
  label?: string;
};

// Función para obtener el color de fondo según el tipo de agente
const getAgentBg = (agentValue: string) => {
  switch (agentValue) {
    case "sales":
      return "bg-gradient-to-br from-emerald-50 to-green-50 border-l-2 border-emerald-300";
    case "customer_support":
      return "bg-gradient-to-br from-blue-50 to-indigo-50 border-l-2 border-blue-300";
    case "content_seo":
      return "bg-gradient-to-br from-purple-50 to-violet-50 border-l-2 border-purple-300";
    case "data_analyst":
      return "bg-gradient-to-br from-cyan-50 to-blue-50 border-l-2 border-cyan-300";
    case "automation_ai":
      return "bg-gradient-to-br from-amber-50 to-yellow-50 border-l-2 border-amber-300";
    case "growth_hacker":
      return "bg-gradient-to-br from-red-50 to-pink-50 border-l-2 border-red-300";
    default:
      return "bg-gradient-to-br from-gray-50 to-slate-50 border-l-2 border-gray-300";
  }
};

// Enhancear las opciones con colores personalizados
const enhancedAgentOptions = AGENT_OPTIONS.map(option => ({
  ...option,
  bgColor: getAgentBg(option.value)
}));

export const AgentDropdown = ({
  selectedAgent,
  onChange,
  className,
  label = "Elige a tu agente",
}: AgentDropdownProps) => {
  return (
    <IconDropdown
      options={enhancedAgentOptions}
      selectedValue={selectedAgent}
      onChange={(value) => onChange(value as AgentType)}
      className={className}
      label={label}
      buttonClassName="py-4"
    />
  );
};
