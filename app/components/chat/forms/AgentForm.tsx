import type { User } from "@prisma/client";
import { ModelDropdown } from "../common/ModelDropdown";
import { AgentDropdown, type AgentType } from "../common/AgentDropdown";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { getAgentPrompt, getAgentName } from "~/utils/agents/agentPrompts";
import { FiCopy, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";

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
  customInstructions?: string;
  handleCustomInstructionsChange?: (value: string) => void;
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
  customInstructions = "",
  handleCustomInstructionsChange,
}: AgentFormProps) => {
  const [showBasePrompt, setShowBasePrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const basePrompt = getAgentPrompt(selectedAgent);
  
  // Actualizar el prompt cuando cambia el agente
  useEffect(() => {
    const finalPrompt = customInstructions 
      ? `${basePrompt}\n\n## INSTRUCCIONES ADICIONALES:\n${customInstructions}`
      : basePrompt;
    
    // Solo actualizar si es diferente para evitar loops
    if (instructions !== finalPrompt) {
      handleInstructionsChange({ 
        target: { value: finalPrompt } 
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [selectedAgent, customInstructions]);

  const handleCustomInstructionsChangeLocal = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    handleCustomInstructionsChange?.(value);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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
        <label className="text-sm text-metal mb-2 flex items-center gap-1">
          Creatividad
          <button className="group flex gap-2">
            <IoInformationCircleOutline />
            <span className="text-xs bg-black text-white rounded px-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out transform scale-95 group-hover:scale-100">
              {selectedModel === 'gpt-5-nano' ? 'Temperatura fija en 1.0 para GPT-5-nano' : 'Temperatura'}
            </span>
          </button>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={selectedModel === 'gpt-5-nano' ? 1 : temperature}
          onChange={handleTemperatureChange}
          disabled={selectedModel === 'gpt-5-nano'}
          className={selectedModel === 'gpt-5-nano' ? 'opacity-50 cursor-not-allowed' : ''}
        />
        <div className="flex justify-between text-sm text-dark mt-0">
          <span>Reservado</span>
          <span>Muy creativo</span>
        </div>
        {selectedModel === 'gpt-5-nano' && (
          <p className="text-xs text-gray-500 mt-1">
            GPT-5-nano solo soporta temperatura fija en 1.0
          </p>
        )}
      </div>

      {/* Sistema de Prompts Mejorado */}
      <div className="space-y-4">
        {/* Prompt Base del Agente */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HiSparkles className="text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">
                Prompt Base: {getAgentName(selectedAgent)}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBasePrompt(!showBasePrompt)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showBasePrompt ? <FiEyeOff /> : <FiEye />}
                {showBasePrompt ? "Ocultar" : "Ver prompt"}
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
              </button>
            </div>
          </div>
          
          {showBasePrompt && (
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-100">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                {basePrompt}
              </pre>
            </div>
          )}
          
          {!showBasePrompt && (
            <p className="text-xs text-gray-600">
              Este agente está preconfigurado con mejores prácticas de la industria.
              Puedes personalizarlo añadiendo instrucciones adicionales abajo.
            </p>
          )}
        </div>

        {/* Personalización Adicional */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Personalización adicional (opcional)
            </h3>
            <span className="text-xs text-gray-500">
              {customInstructions.length}/500 caracteres
            </span>
          </div>
          <textarea
            value={customInstructions}
            onChange={handleCustomInstructionsChangeLocal}
            placeholder="Añade instrucciones específicas para tu negocio, productos, tono de voz, restricciones, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            rows={4}
            maxLength={500}
          />
          
          {/* Variables Dinámicas Sugeridas */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Sugerencias:</span>
            {["Nombre empresa", "Horario atención", "Enlaces importantes", "Políticas"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleCustomInstructionsChange?.(customInstructions + ` [${tag}]`)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Preview del Prompt Final (Oculto) */}
        <div className="hidden">
          <textarea
            value={instructions}
            onChange={handleInstructionsChange}
            className="w-full"
            readOnly
          />
        </div>
        
        {/* Indicador de Prompt Combinado */}
        {customInstructions && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700 flex items-center gap-2">
              <FiCheck className="text-green-600" />
              Prompt personalizado activo: Base + tus instrucciones adicionales
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
