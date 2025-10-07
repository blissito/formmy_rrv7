import type { User } from "@prisma/client";
import { ModelDropdown } from "../common/ModelDropdown";
import { AgentDropdown, type AgentType } from "../common/AgentDropdown";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useState, useEffect, useMemo } from "react";
import { getAgentPrompt, getAgentName } from "~/utils/agents/agentPrompts";
import { FiCopy, FiCheck, FiEye, FiMaximize2 } from "react-icons/fi";
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
  const [showBasePromptModal, setShowBasePromptModal] = useState(false);
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

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (showBasePromptModal) setShowBasePromptModal(false);
      }
    };

    if (showModal || showBasePromptModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal, showBasePromptModal]);

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

      {/* Selector de personalidad de agente */}
      <div>
        <AgentDropdown
          selectedAgent={selectedAgent}
          onChange={handleAgentChange}
          label="Personalidad del agente"
        />
      </div>

      {/* Temperature control - Comentado temporalmente (modelos usan temperatura fija optimizada) */}
      {/* <div>
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
          {/* {!isFixedTemp && tempRange.optimal !== tempRange.min && (
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
      </div> */}

      {/* Sistema de Prompts Mejorado */}
      <div className="space-y-4">
        {/* Prompt Base del Agente */}
        <div className="bg-cloud/20 rounded-lg p-4 border border-cloud">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiSparkles className="text-cloud" />
              <h3 className="text-sm font-medium text-gray-900">
                Prompt Base: {getAgentName(selectedAgent)}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowBasePromptModal(true)}
              className="text-sm text-teal-500 hover:text-teal-700 flex items-center gap-1"
            >
              <FiEye />
              Ver prompt
            </button>
          </div>
        </div>

        {/* Personalización Adicional */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Personalización adicional (opcional)
            </h3>
            <div className="flex items-center gap-3">
             
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:border-brand-500 resize-y text-sm"
            rows={8}
            maxLength={1500}
          />
           <p className="text-xs text-gray-500 text-end">
                {customInstructions.length}/1500 caracteres
              </p>
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
            className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <h3 className="text-2xl font-semibold text-dark">
                Personalización adicional
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {customInstructions.length}/1500 caracteres
                </span>
          
                <button    type="button"
                  onClick={() => setShowModal(false)}
                   className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                  <img
                    alt="close"
                    src="/assets/close.svg"
                  />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex flex-col gap-3">
              {/* Tooltip educativo en modal */}
              <div className="p-3 bg-brand-500/20 border border-brand-500 rounded-lg text-xs text-dark">
                <p className="font-medium mb-1">💡 ¿Qué añadir aquí?</p>
                <ul className="ml-4 space-y-1 list-disc text-dark">
                  <li>Nombre de tu empresa/producto y qué ofreces</li>
                  <li>Políticas específicas (devoluciones, horarios, precios)</li>
                  <li>Tono de voz y personalidad única de tu marca</li>
                  <li>Restricciones o temas que NO debe tratar</li>
                </ul>
                <p className="mt-2 text-metal">
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
            <div className="flex justify-end gap-2 p-4 ">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-12 rounded-full border bg-outlines px-6 text-metal"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Base Prompt */}
      {showBasePromptModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBasePromptModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <h3 className="text-2xl font-semibold text-dark">
                Prompt Base: {getAgentName(selectedAgent)}
              </h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBasePromptModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <img
                    alt="close"
                    src="/assets/close.svg"
                  />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex flex-col gap-3">
              {/* Info sobre el prompt base */}
              <div className="p-3 bg-cloud/20 border border-cloud rounded-lg text-xs text-dark">
                <p className="font-medium mb-1">ℹ️ Acerca de este prompt</p>
                <p className="text-metal">
                  Este es el prompt base del agente <strong>{getAgentName(selectedAgent)}</strong>.
                  Define su personalidad, tono y comportamiento principal.
                  Tus instrucciones personalizadas se añaden a este prompt para adaptarlo a tu negocio.
                </p>
              </div>

              <div className="bg-white border border-outlines rounded-2xl p-4 flex-1 overflow-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {basePrompt}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4">
              <button
                type="button"
                onClick={() => setShowBasePromptModal(false)}
                className="h-12 rounded-full border bg-outlines px-6 text-metal"
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
