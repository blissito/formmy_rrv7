/**
 * VoiceIntegrationCard Component
 * Tarjeta de integración de voz para el dashboard de chatbots
 *
 * Muestra el estado de la integración de voz y permite habilitar/deshabilitar
 * y configurar opciones básicas como voz y mensaje de bienvenida.
 */

import { useState } from "react";
import { FiPhone, FiSettings } from "react-icons/fi";
import toast from "react-hot-toast";

interface VoiceIntegrationCardProps {
  chatbotId: string;
  voiceEnabled: boolean;
  ttsVoiceId?: string | null;
  userPlan: string;
  onToggle: (enabled: boolean) => Promise<void>;
  onUpdate: (settings: { ttsVoiceId: string }) => Promise<void>;
}

// Mapeo de voces ElevenLabs (ACTUALIZADO - Enero 2025)
// ✅ ÚNICA VOZ NATIVA MEXICANA VERIFICADA
const VOICE_OPTIONS = {
  "3l9iCMrNSRR0w51JvFB0": { name: "Leo Moreno", gender: "Masculino", default: true },
  // ❌ Voces legacy eliminadas (eran gringas con acento extranjero)
} as const;

export default function VoiceIntegrationCard({
  chatbotId,
  voiceEnabled,
  ttsVoiceId,
  userPlan,
  onToggle,
  onUpdate,
}: VoiceIntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(ttsVoiceId || "3l9iCMrNSRR0w51JvFB0"); // Default: Leo Moreno (voz nativa mexicana)

  // Validar plan
  const isPlanAllowed = userPlan === "PRO" || userPlan === "ENTERPRISE" || userPlan === "TRIAL";

  /**
   * Toggle habilitar/deshabilitar voz
   */
  const handleToggle = async () => {
    if (!isPlanAllowed) {
      toast.error("Requiere plan PRO o superior");
      return;
    }

    setIsLoading(true);
    try {
      await onToggle(!voiceEnabled);
      toast.success(voiceEnabled ? "Voz deshabilitada" : "Voz habilitada");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Guardar configuración
   */
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await onUpdate({
        ttsVoiceId: selectedVoice,
      });
      toast.success("Configuración guardada");
      setShowSettings(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-full ${
              voiceEnabled ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <FiPhone
              className={`w-6 h-6 ${voiceEnabled ? "text-green-600" : "text-gray-500"}`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Conversaciones de Voz
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Beta
              </span>
            </h3>
            <p className="text-sm text-gray-500">
              Permite a usuarios hablar con el chatbot en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Estado */}
      {!isPlanAllowed && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Requiere plan <strong>PRO</strong> o superior para usar voz
          </p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={isLoading || !isPlanAllowed}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            voiceEnabled
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {voiceEnabled ? "Deshabilitar" : "Habilitar Voz"}
        </button>

        {voiceEnabled && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FiSettings className="w-4 h-4" />
            Configurar
          </button>
        )}
      </div>

      {/* Modal de configuración */}
      {showSettings && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Configuración de Voz</h4>

          {/* Selector de voz */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voz del Asistente
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(VOICE_OPTIONS).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name} ({info.gender} - Español MX) {info.default && "★"}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Proveedor: ElevenLabs (Calidad premium)
            </p>
          </div>

          {/* Nota sobre instrucciones */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> El asistente de voz usa las mismas instrucciones personalizadas configuradas en la pestaña "Configuración" del chatbot.
            </p>
          </div>

          {/* Límites */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Límites:</strong> Máximo 10 minutos por sesión • 5 créditos por minuto
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Guardar Cambios
            </button>
            <button
              onClick={() => setShowSettings(false)}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
