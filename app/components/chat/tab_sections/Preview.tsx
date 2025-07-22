import { useState } from "react";
import { Button } from "../PageContainer";
import { ChipTabs } from "../common/ChipTabs";
import { ChatPreview } from "./ChatPreview";
import type { Chatbot, User } from "@prisma/client";
import { ModelDropdown } from "../common/ModelDropdown";
import { AgentDropdown, type AgentType } from "../common/AgentDropdown";
import { IoInformationCircleOutline } from "react-icons/io5";
import toast from "react-hot-toast";

// Componente para el tab de Preview
export const PreviewForm = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  const [activeTab, setActiveTab] = useState("Chat");
  const [selectedModel, setSelectedModel] = useState(
    chatbot.aiModel || "mistralai/mistral-small-3.2-24b-instruct:free"
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(
    (chatbot.personality as AgentType) || "customer_service"
  );
  const [temperature, setTemperature] = useState(chatbot.temperature || 1);
  const [instructions, setInstructions] = useState(
    chatbot.instructions ||
      "Eres un asistente virtual útil y amigable. Responde de manera profesional y clara a las preguntas de los usuarios."
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  const handleAgentChange = (value: AgentType) => {
    setSelectedAgent(value);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(parseFloat(e.target.value));
  };

  const handleInstructionsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInstructions(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const formData = new FormData();
    formData.append("intent", "update_chatbot");
    formData.append("chatbotId", chatbot.id);
    formData.append("aiModel", selectedModel);
    formData.append("temperature", temperature.toString());
    formData.append("instructions", instructions);
    formData.append("personality", selectedAgent); // Guardamos el tipo de agente en personality
    // No necesitamos enviar userId, el endpoint lo obtiene del request

    try {
      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cambios guardados correctamente");
      } else {
        toast.error(result.error || "Error al actualizar chatbot");
        console.error("Error al actualizar chatbot:", result.error);
      }
    } catch (error) {
      toast.error("Error al guardar los cambios");
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="w-full">
      <header className="flex items-center justify-between w-full mb-6">
        <ChipTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Button mode="ghost" onClick={handleSave} isLoading={isSaving}>
          <div className="flex gap-2 items-center">
            <img
              src="/assets/chat/diskette.svg"
              alt="diskette save button"
              className="w-5 h-5"
            />
            <span>{isSaving ? "Guardando..." : "Guardar"}</span>
          </div>
        </Button>
      </header>

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
    </article>
  );
};
