import { useState, useMemo } from "react";
import { Button, usePreviewContext } from "../PageContainer";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import type { Chatbot, User, Integration } from "@prisma/client";
import toast from "react-hot-toast";
import { AgentForm } from "../forms/AgentForm";
import { ChatForm } from "../forms/ChatForm";
import { useSubmit } from "react-router";
import { useS3Upload } from "~/hooks/useS3Upload";
import ChatPreview from "~/components/ChatPreview";
import { cn } from "~/lib/utils";
import { IoClose } from "react-icons/io5";
import { MdOutlineRemoveRedEye } from "react-icons/md";
// import { getAgentWelcomeMessage, getAgentGoodbyeMessage } from "~/utils/agents/agentPrompts";
import type { AgentType } from "../common/AgentDropdown";

// Componente para el tab de Preview
export const PreviewForm = ({
  chatbot,
  user,
  integrations,
}: {
  chatbot: Chatbot;
  user: User;
  integrations?: Integration[];
}) => {
  const submit = useSubmit();
  const { uploadFile } = useS3Upload();
  // Usar el hook con persistencia en localStorage, usando el chatbot.id como contexto único
  const { currentTab: activeTab, setCurrentTab: setActiveTab } = useChipTabs("Chat", `preview_${chatbot.id}`);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
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
    // Los agentes ya no cambian automáticamente mensajes ni color
    // setWelcomeMessage(getAgentWelcomeMessage(value));
    // setGoodbyeMessage(getAgentGoodbyeMessage(value));
    // setPrimaryColor(getAgentColor(value));
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
          setIsSaving(false);
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al subir la imagen";
        console.error("Upload error:", error);
        toast.error(message);
        setIsSaving(false);
        return;
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

  // ✅ FIX: Estabilizar el objeto chatbot para evitar remounts innecesarios de ChatPreview en modal
  const previewChatbot = useMemo(
    () => ({
      ...chatbot,
      name,
      primaryColor,
      welcomeMessage,
      goodbyeMessage,
      avatarUrl,
      aiModel: selectedModel,
      temperature,
      instructions,
      personality: selectedAgent,
      customInstructions,
    }),
    [
      chatbot,
      name,
      primaryColor,
      welcomeMessage,
      goodbyeMessage,
      avatarUrl,
      selectedModel,
      temperature,
      instructions,
      selectedAgent,
      customInstructions,
    ]
  );

  return (
    <>
      <article className="w-full h-full ">
        <header className="flex items-center justify-between w-full mb-6 ">
          <ChipTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex items-center gap-2">
            {/* Botón Preview - Solo visible en mobile/tablet */}
            <button
              onClick={() => setShowPreviewModal(true)}
              className="lg:hidden h-10 w-10 rounded-lg border border-outlines hover:bg-gray-50 transition-colors flex items-center justify-center"
              title="Ver preview"
            >
              <MdOutlineRemoveRedEye className="w-5 h-5 text-metal" />
            </button>

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
          </div>
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

      {/* Modal Preview Full Screen - Solo en mobile/tablet */}
      {showPreviewModal && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-hidden">
          {/* Header del modal */}
          <div className="sticky top-0 z-10 bg-white border-b border-outlines px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark">Preview</h3>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
            >
              <IoClose className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Content del modal */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto p-4">
            <ChatPreview
              chatbot={previewChatbot}
              integrations={integrations}
            />
          </div>
        </div>
      )}
    </>
  );
};
