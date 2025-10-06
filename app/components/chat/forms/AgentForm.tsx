import type { User } from "@prisma/client";
import { ModelDropdown } from "../common/ModelDropdown";
import { AgentDropdown, type AgentType } from "../common/AgentDropdown";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useState, useEffect, useMemo } from "react";
import { getAgentPrompt, getAgentName } from "~/utils/agents/agentPrompts";
import { FiCopy, FiCheck, FiEye, FiEyeOff, FiMaximize2 } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { getTemperatureRange } from "server/config/model-temperatures";

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
  const [showModal, setShowModal] = useState(false);
  const basePrompt = getAgentPrompt(selectedAgent);

  // Sincronizar instructions solo para preview (no se combina con customInstructions)
  useEffect(() => {
    // Solo actualizar si es diferente para evitar loops
    if (instructions !== basePrompt) {
      handleInstructionsChange({
        target: { value: basePrompt }
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [selectedAgent]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  const handleCustomInstructionsChangeLocal = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    handleCustomInstructionsChange?.(value);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Obtener rangos de temperatura según el modelo seleccionado
  const tempRange = useMemo(() => getTemperatureRange(selectedModel), [selectedModel]);
  const isFixedTemp = tempRange.fixed === true;
  const currentValue = isFixedTemp ? tempRange.optimal : temperature;

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
          <button type="button" className="group relative flex items-center">
            <IoInformationCircleOutline className="text-gray-400" />
            <span className="absolute left-6 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {isFixedTemp
                ? `Temperatura fija en ${tempRange.optimal} para ${selectedModel}`
                : `Óptimo: ${tempRange.optimal} | Rango: ${tempRange.min}-${tempRange.max}`}
            </span>
          </button>
        </label>
        <div className="relative">
          <input
            type="range"
            min={tempRange.min}
            max={tempRange.max}
            step={tempRange.step || 0.1}
            value={currentValue}
            onChange={handleTemperatureChange}
            disabled={isFixedTemp}
            className={`w-full ${isFixedTemp ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          />
          {/* Marcador visual del valor óptimo */}
          {!isFixedTemp && tempRange.optimal !== tempRange.min && (
            <div
              className="absolute top-0 w-0.5 h-full bg-blue-500 pointer-events-none"
              style={{
                left: `${((tempRange.optimal - tempRange.min) / (tempRange.max - tempRange.min)) * 100}%`,
                opacity: 0.4
              }}
            />
          )}
        </div>
        <div className="flex justify-between items-center text-sm text-dark mt-1">
          <span>Reservado ({tempRange.min})</span>
          <span className="text-blue-600 font-medium">Actual: {currentValue.toFixed(1)}</span>
          <span>Creativo ({tempRange.max})</span>
        </div>
        {isFixedTemp ? (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <span>🔒</span>
            <span>Este modelo requiere temperatura fija en {tempRange.optimal}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            Recomendado: <span className="font-medium text-blue-600">{tempRange.optimal}</span> para balance óptimo
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {customInstructions.length}/1500 caracteres
              </span>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FiMaximize2 />
                Expandir
              </button>
            </div>
          </div>

          <textarea
            value={customInstructions}
            onChange={handleCustomInstructionsChangeLocal}
            placeholder="Añade contexto específico de tu negocio: nombre, productos, horarios, políticas, tono de voz, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
            rows={8}
            maxLength={1500}
          />
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
      </div>

      {/* Modal para textarea expandido */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Personalización adicional
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {customInstructions.length}/1500 caracteres
                </span>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex flex-col gap-3">
              {/* Tooltip educativo en modal */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
                <p className="font-medium mb-1">💡 ¿Qué añadir aquí?</p>
                <ul className="ml-4 space-y-1 list-disc text-gray-600">
                  <li>Nombre de tu empresa/producto y qué ofreces</li>
                  <li>Políticas específicas (devoluciones, horarios, precios)</li>
                  <li>Tono de voz y personalidad única de tu marca</li>
                  <li>Restricciones o temas que NO debe tratar</li>
                </ul>
                <p className="mt-2 text-gray-500">
                  <strong>Importante:</strong> Este texto se añade al prompt base del agente para personalizarlo a tu negocio.
                </p>
              </div>

              <textarea
                value={customInstructions}
                onChange={handleCustomInstructionsChangeLocal}
                placeholder="Ejemplo: 'Somos TechStore, vendemos laptops y accesorios. Horario: Lun-Vie 9-18h. Envíos gratis en compras >$1000. Tono amigable pero profesional.'"
                className="w-full flex-1 min-h-[400px] px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                maxLength={1500}
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
