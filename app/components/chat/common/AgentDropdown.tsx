import { IconDropdown, type DropdownOption } from "./IconDropdown";

// Tipos de agentes disponibles
export type AgentType =
  | "customer_service"
  | "sales"
  | "technical_support"
  | "general";

// Opciones de agentes predefinidas
const AGENT_OPTIONS: DropdownOption[] = [
  {
    value: "customer_service",
    label: "Agente de servicio al cliente",
    description: "Especializado en atención y soporte",
    iconSrc: "/assets/chat/agents/customer-service.svg",
  },
  {
    value: "sales",
    label: "Agente de ventas",
    description: "Especializado en conversión y ventas",
    iconSrc: "/assets/chat/agents/sales.svg",
  },
  {
    value: "technical_support",
    label: "Soporte técnico",
    description: "Especializado en resolver problemas técnicos",
    iconSrc: "/assets/chat/agents/technical.svg",
  },
  {
    value: "general",
    label: "Asistente general",
    description: "Responde a todo tipo de consultas",
    iconSrc: "/assets/chat/agents/general.svg",
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
