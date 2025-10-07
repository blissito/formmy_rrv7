import { IconDropdown, type DropdownOption } from "./IconDropdown";

// Tipos de agentes disponibles
export type AgentType =
  | "sales"
  | "customer_support"
  | "data_analyst"
  | "coach"
  | "medical_receptionist"
  | "educational_assistant";

// Opciones de agentes predefinidas
const AGENT_OPTIONS: DropdownOption[] = [
  {
    value: "customer_support",
    label: "Soporte al Cliente",
    description: "Customer success y resolución rápida",
    iconSrc: "/assets/chat/agents/customer-service.svg",
  },
  {
    value: "sales",
    label: "Agente de Ventas",
    description: "Experto en ventas consultivas B2B/B2C",
    iconSrc: "/assets/chat/agents/sales.svg",
  },
  {
    value: "data_analyst",
    label: "Analista de Datos",
    description: "Insights y visualización de métricas",
    iconSrc: "/assets/chat/agents/analytics.svg",
  },
  {
    value: "coach",
    label: "Coach Personal",
    description: "Desarrollo personal y profesional",
    iconSrc: "/assets/chat/agents/coach.svg",
  },
  {
    value: "medical_receptionist",
    label: "Recepcionista Médico",
    description: "Gestión de citas y consultas médicas",
    iconSrc: "/assets/chat/agents/medical.svg",
  },
  {
    value: "educational_assistant",
    label: "Asistente Educativo",
    description: "Apoyo personalizado en aprendizaje",
    iconSrc: "/assets/chat/agents/education.svg",
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
    case "data_analyst":
      return "bg-gradient-to-br from-amber-50 to-yellow-50 border-l-2 border-amber-300";
    case "coach":
      return "bg-gradient-to-br from-purple-50 to-violet-50 border-l-2 border-purple-300";
    case "medical_receptionist":
      return "bg-gradient-to-br from-cyan-50 to-blue-50 border-l-2 border-cyan-300";
    case "educational_assistant":
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
  label = "Personalidad del agente",
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
