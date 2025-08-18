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

export const AgentDropdown = ({
  selectedAgent,
  onChange,
  className,
  label = "Elige a tu agente",
}: AgentDropdownProps) => {
  return (
    <IconDropdown
      options={AGENT_OPTIONS}
      selectedValue={selectedAgent}
      onChange={(value) => onChange(value as AgentType)}
      className={className}
      label={label}
      buttonClassName="py-4"
    />
  );
};
