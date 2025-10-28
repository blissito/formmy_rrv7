/**
 * Voice Integration Modal
 * Maneja la configuración de voz para chatbots
 */

import { useState, useEffect } from "react";
import Modal from "~/components/Modal";
import { Button } from "~/components/Button";
import { FiPhone } from "react-icons/fi";
import type { Chatbot, Integration } from "@prisma/client";

interface VoiceIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  chatbot: Chatbot;
  existingIntegration?: Integration | null;
  userPlan: string;
}

export default function VoiceIntegrationModal({
  isOpen,
  onClose,
  onSuccess,
  chatbot,
  existingIntegration,
  userPlan,
}: VoiceIntegrationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(!!existingIntegration?.isActive);

  // Configuración de voz
  const metadata = (existingIntegration?.metadata as any) || {};
  const [selectedVoice, setSelectedVoice] = useState(
    metadata.ttsVoiceId || "3l9iCMrNSRR0w51JvFB0" // Leo Moreno (ElevenLabs - ÚNICA voz nativa mexicana - default)
  );

  // Validar plan
  const isPlanAllowed = userPlan === "PRO" || userPlan === "ENTERPRISE" || userPlan === "TRIAL";

  // Actualizar estado cuando cambie la integración
  useEffect(() => {
    setIsConnected(!!existingIntegration?.isActive);
  }, [existingIntegration]);

  // No renderizar si el modal no está abierto
  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!isPlanAllowed) {
      setError("Requiere plan PRO o superior para usar conversaciones de voz");
      return;
    }

    setError(null);
    setIsActivating(true);

    try {
      console.log("🎤 [VOICE MODAL] Iniciando activación...");

      // Crear integración de voz
      const createRes = await fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "upsert",
          chatbotId: chatbot.id,
          platform: "VOICE",
          token: "voice_enabled",
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || "Error al crear integración de voz");
      }

      const data = await createRes.json();
      const integrationId = data.integration.id;

      // Activar la integración
      const activateRes = await fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "update",
          integrationId,
          isActive: "true",
          metadata: JSON.stringify({
            ttsVoiceId: selectedVoice,
          }),
        }),
      });

      if (!activateRes.ok) {
        throw new Error("Error al activar integración de voz");
      }

      setIsConnected(true);
      console.log("✅ [VOICE MODAL] Voz activada exitosamente");

      if (onSuccess) {
        onSuccess({ connected: true, provider: "voice" });
      }
    } catch (err: any) {
      console.error("❌ [VOICE MODAL] Error:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!existingIntegration) return;

    setError(null);
    setIsDeactivating(true);

    try {
      const response = await fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "update",
          integrationId: existingIntegration.id,
          isActive: "false",
        }),
      });

      if (!response.ok) {
        throw new Error("Error al desactivar voz");
      }

      setIsConnected(false);

      if (onSuccess) {
        onSuccess({ disconnected: true });
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!existingIntegration) return;

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "update",
          integrationId: existingIntegration.id,
          isActive: "true", // ✅ Mantener activa al guardar configuración
          metadata: JSON.stringify({
            ttsVoiceId: selectedVoice,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar configuración");
      }

      console.log("✅ Configuración guardada");

      if (onSuccess) {
        onSuccess({ updated: true });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Conversaciones de Voz" size="lg">
      <div className="space-y-6">
        {/* Estado conectado */}
        {isConnected && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">Voz Activada</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Los usuarios pueden hablar con tu chatbot en tiempo real
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header con logo (solo si no está conectado) */}
        {!isConnected && (
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiPhone className="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Conversaciones de Voz</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permite a los usuarios hablar con tu chatbot mediante voz
              </p>
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
            ¿Qué incluye?
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Conversaciones bidireccionales en tiempo real</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Voces naturales en español mexicano</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Integración completa con herramientas del chatbot</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Transcripciones automáticas de conversaciones</span>
            </li>
          </ul>
        </div>

        {/* Configuración (solo si está conectado) */}
        {isConnected && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Configuración de Voz
            </h4>

            {/* Selector de voz - ElevenLabs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voz del Asistente
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={isActivating || isDeactivating || isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="3l9iCMrNSRR0w51JvFB0">
                  Leo Moreno (Masculino - Voz Nativa Mexicana) ★
                </option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Proveedor: ElevenLabs (Única voz nativa mexicana disponible)
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                ⚠️ Nota: Actualmente solo hay 1 voz nativa mexicana en ElevenLabs. Las voces femeninas están en desarrollo.
              </p>
            </div>

            {/* Nota sobre instrucciones */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Nota:</strong> El asistente de voz usa las mismas instrucciones personalizadas configuradas en la pestaña "Configuración" del chatbot.
              </p>
            </div>
          </div>
        )}

        {/* Requisitos de plan */}
        {!isPlanAllowed && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Requiere plan PRO o superior</strong> para activar conversaciones de voz
            </p>
          </div>
        )}

        {/* Límites - Simplificado */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⏱️</div>
            <div>
              <h4 className="font-medium text-sm text-purple-900 dark:text-purple-100 mb-1">
                Duración de Llamadas
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Máximo 10 minutos por llamada
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                Se consumen 5 créditos por minuto
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 items-center -mr-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isActivating || isDeactivating || isSaving}
            className="!max-w-none !w-auto !h-11 px-6 !flex !items-center !justify-center !mt-0 !mx-0"
          >
            {isConnected ? "Cerrar" : "Cancelar"}
          </Button>

          {/* Botón de Desconectar (solo si está conectado) */}
          {isConnected && (
            <Button
              onClick={handleDisconnect}
              disabled={isActivating || isDeactivating || isSaving}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 px-6 !max-w-none !w-auto !h-11 !flex !items-center !justify-center !mt-0 !mx-0"
            >
              {isDeactivating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-red-700 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Desactivando...</span>
                </>
              ) : (
                <span>Desactivar</span>
              )}
            </Button>
          )}

          {/* Botón de Guardar (solo si está conectado) */}
          {isConnected && (
            <Button
              onClick={handleUpdateSettings}
              disabled={isActivating || isDeactivating || isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 !max-w-none !w-auto !h-11 !flex !items-center !justify-center !mt-0 !mx-0"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </Button>
          )}

          {/* Botón de Activar (solo si NO está conectado) */}
          {!isConnected && (
            <Button
              onClick={handleConnect}
              disabled={isActivating || isDeactivating || isSaving || !isPlanAllowed}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 !max-w-none !w-auto !h-11 !flex !items-center !justify-center !mt-0 !mx-0"
            >
              {isActivating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Activando...</span>
                </>
              ) : (
                <>
                  <FiPhone className="w-4 h-4 mr-2" />
                  <span>Activar Voz</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
