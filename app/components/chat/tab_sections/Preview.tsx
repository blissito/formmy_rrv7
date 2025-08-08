import { useState } from "react";
import { Button } from "../PageContainer";
import { ChipTabs } from "../common/ChipTabs";
import type { Chatbot, User } from "@prisma/client";
import { type AgentType } from "../common/AgentDropdown";
import toast from "react-hot-toast";
import { AgentForm } from "../forms/AgentForm";
import { ChatForm } from "../forms/ChatForm";
import { useSubmit } from "react-router";
import { useS3Upload } from "~/hooks/useS3Upload";

// Componente para el tab de Preview
export const PreviewForm = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  const submit = useSubmit();
  const { uploadFile } = useS3Upload();
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
  const [name, setName] = useState(chatbot.name || "Geeki");
  const [primaryColor, setPrimaryColor] = useState(
    chatbot.primaryColor || "#63CFDE"
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?"
  );
  const [goodbyeMessage, setGoodbyeMessage] = useState(
    chatbot.goodbyeMessage ||
      "Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte."
  );
  const [avatarUrl, setAvatarUrl] = useState(chatbot.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handlePrimaryColorChange = (value: string) => {
    setPrimaryColor(value);
  };

  const handleWelcomeMessageChange = (value: string) => {
    setWelcomeMessage(value);
  };

  const handleGoodbyeMessageChange = (value: string) => {
    setGoodbyeMessage(value);
  };

  const handleAvatarChange = (value: string) => {
    setAvatarUrl(value);
  };

  const handleAvatarFileChange = (file: File | null) => {
    setAvatarFile(file);
  };
  const handleSave = async () => {
    setIsSaving(true);

    // Si hay un archivo seleccionado, subirlo primero
    let imageResult;
    if (avatarFile) {
      try {
        imageResult = await uploadFile(
          avatarFile,
          "chatbot-avatars",
          chatbot.slug
        );
        if (!imageResult?.publicUrl) {
          toast.error("Error al subir la imagen");
        }
      } catch (error) {
        toast.error("Error al subir la imagen");
      }
    }

    const formData = new FormData();
    formData.append("intent", "update_chatbot");
    formData.append("name", name);
    formData.append("chatbotId", chatbot.id);
    formData.append("aiModel", selectedModel);
    formData.append("temperature", temperature.toString());
    formData.append("instructions", instructions);
    formData.append("personality", selectedAgent); // Guardamos el tipo de agente en personality
    formData.append("primaryColor", primaryColor);
    formData.append("welcomeMessage", welcomeMessage);
    formData.append("goodbyeMessage", goodbyeMessage);
    imageResult?.publicUrl &&
      formData.append("avatarUrl", imageResult.publicUrl);
    try {
      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cambios guardados correctamente");
        // Actualizar avatarUrl con la URL final y limpiar archivo
        setAvatarFile(null);
      } else {
        toast.error(result.error || "Error al actualizar chatbot");
      }
    } catch (error) {
      toast.error("Error al guardar los cambios");
    } finally {
      submit({}); // @todo level up state
      setIsSaving(false);
    }
  };

  return (
    <article className="w-full h-full overflow-y-scroll">
      <header className="flex items-center justify-between w-full mb-6 ">
        <ChipTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Button
          className="h-10"
          mode="ghost"
          onClick={handleSave}
          isLoading={isSaving}
        >
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
      {activeTab === "Chat" && (
        <ChatForm
          name={name}
          primaryColor={primaryColor}
          welcomeMessage={welcomeMessage}
          goodbyeMessage={goodbyeMessage}
          avatarUrl={avatarUrl}
          chatbotSlug={chatbot.slug}
          isSaving={isSaving}
          onNameChange={handleNameChange}
          onPrimaryColorChange={handlePrimaryColorChange}
          onWelcomeMessageChange={handleWelcomeMessageChange}
          onGoodbyeMessageChange={handleGoodbyeMessageChange}
          onAvatarChange={handleAvatarChange}
          onAvatarFileChange={handleAvatarFileChange}
        />
      )}
      {activeTab === "Agente" && (
        <AgentForm
          selectedModel={selectedModel}
          handleModelChange={handleModelChange}
          user={user}
          selectedAgent={selectedAgent}
          handleAgentChange={handleAgentChange}
          temperature={temperature}
          handleTemperatureChange={handleTemperatureChange}
          instructions={instructions}
          handleInstructionsChange={handleInstructionsChange}
        />
      )}
    </article>
  );
};
