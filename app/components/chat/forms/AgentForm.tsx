import type { User } from "@prisma/client";
import { ModelDropdown } from "../common/ModelDropdown";
import { AgentDropdown, type AgentType } from "../common/AgentDropdown";
import { IoInformationCircleOutline } from "react-icons/io5";

interface AgentFormProps {
  selectedModel: string;
  handleModelChange: (value: string) => void;
  user: User;
  selectedAgent: AgentType;
  handleAgentChange: (value: AgentType) => void;
  temperature: number;
  handleTemperatureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  instructions: string;
  handleInstructionsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const AgentForm = ({
  selectedModel,
  handleModelChange,
  user,
  selectedAgent,
  handleAgentChange,
  temperature,
  handleTemperatureChange,
  instructions,
  handleInstructionsChange,
}: AgentFormProps) => {
  return (
    <div className="grid gap-4">
      {/* Panel de configuración */}
      <h2 className="text-lg font-medium">Características de tu agente</h2>

      {/* Selector de modelo de IA */}
      <div>
        <ModelDropdown
          selectedModel={selectedModel}
          onChange={handleModelChange}
          user={user}
        />
      </div>

      {/* Selector de tipo de agente */}
      <div>
        <AgentDropdown
          selectedAgent={selectedAgent}
          onChange={handleAgentChange}
          label="Elige a tu agente"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 mb-2 flex items-center gap-1">
          Creatividad
          <button className="group flex gap-2">
            <IoInformationCircleOutline />
            <span className="text-xs bg-black text-white rounded-full px-2 invisible group-hover:visible">
              Temperatura
            </span>
          </button>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={handleTemperatureChange}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Reservado</span>
          <span>Muy creativo</span>
        </div>
      </div>

      {/* Instrucciones */}
      <div>
        <h3 className="text-sm mb-2">Instrucciones</h3>
        <textarea
          value={instructions}
          onChange={handleInstructionsChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={8}
        />
      </div>
    </div>
  );
};
