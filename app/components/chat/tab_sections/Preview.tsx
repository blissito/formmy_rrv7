import { useState } from "react";
import { Button, usePreviewContext } from "../PageContainer";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import type { Chatbot, User } from "@prisma/client";
import toast from "react-hot-toast";
import { AgentForm } from "../forms/AgentForm";
import { ChatForm } from "../forms/ChatForm";
import { useSubmit } from "react-router";
import { useS3Upload } from "~/hooks/useS3Upload";
import { getAgentWelcomeMessage, getAgentGoodbyeMessage, getAgentColor } from "~/utils/agents/agentPrompts";
import type { AgentType } from "../common/AgentDropdown";

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
  // Usar el hook con persistencia en localStorage, usando el chatbot.id como contexto único
  const { currentTab: activeTab, setCurrentTab: setActiveTab } = useChipTabs("Chat", `preview_${chatbot.id}`);
  const [isSaving, setIsSaving] = useState(false);
  
  // Usar el contexto para obtener y actualizar el estado
  const {
    selectedModel,
    setSelectedModel,
    selectedAgent,
    setSelectedAgent,
    temperature,
    setTemperature,
    instructions,
    setInstructions,
    customInstructions,
    setCustomInstructions,
    name,
    setName,
    primaryColor,
    setPrimaryColor,
    welcomeMessage,
    setWelcomeMessage,
    goodbyeMessage,
    setGoodbyeMessage,
    avatarUrl,
    setAvatarUrl,
    avatarFile,
    setAvatarFile,
  } = usePreviewContext();

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  const handleAgentChange = (value: AgentType) => {
    setSelectedAgent(value);
    // Actualizar automáticamente los mensajes y el color cuando cambie el agente
    setWelcomeMessage(getAgentWelcomeMessage(value));
    setGoodbyeMessage(getAgentGoodbyeMessage(value));
    setPrimaryColor(getAgentColor(value));
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
    formData.append("customInstructions", customInstructions);
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
        // Limpiar archivo temporal
        setAvatarFile(null);
        // Recargar datos del loader para sincronizar con la BD
        submit({});
      } else {
        toast.error(result.error || "Error al actualizar chatbot");
      }
    } catch (error) {
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="w-full h-full ">
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
          customInstructions={customInstructions}
          handleCustomInstructionsChange={setCustomInstructions}
        />
      )}
    </article>
  );
};
