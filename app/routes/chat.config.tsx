import { useState } from "react";
import { Form, Link, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/chat.config";
import { Button } from "~/components/Button";
import { Toggle } from "~/components/Switch";
import { Avatar } from "~/components/icons/Avatar";
import { data as json } from "react-router";
import { IoChevronDown, IoArrowBack, IoSend } from "react-icons/io5";

export const meta = () => [
  { title: "Configuración del Chatbot - Fixtergeek" },
  { name: "description", content: "Configura tu chatbot personalizado" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  // Aquí cargarías los datos del chatbot desde la base de datos
  // Por ahora devolvemos datos de ejemplo
  return json({
    chatbot: {
      id: "fixtergeek-123",
      name: "Fixtergeek",
      primaryColor: "#63CFDE",
      welcomeMessage: "¡Hola! ¿Cómo puedo ayudarte hoy?",
      personality: "Agente de servicio al cliente",
      aiModel: "gpt-4o-mini",
      temperature: 0.7,
      prompt: `### Rol
- Función principal: Eres un agente de atención al cliente que asiste a los usuarios con base en los datos de capacitación específicos proporcionados. Tu objetivo principal es informar, aclarar y responder preguntas estrictamente relacionadas con estos datos de capacitación y tu rol.

### Proceso`,
      isActive: true,
    },
    availableModels: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      {
        value: "mistralai/mistral-small-3.2-24b-instruct",
        label: "Mistral Small",
      },
      { value: "anthropic/claude-3-haiku-20240307", label: "Claude Haiku" },
    ],
    personalities: [
      { value: "customer-service", label: "Agente de servicio al cliente" },
      { value: "sales-assistant", label: "Asistente de ventas" },
      { value: "technical-support", label: "Soporte técnico" },
      { value: "friendly-assistant", label: "Asistente amigable" },
    ],
  });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Simular userId para pruebas
  formData.set("userId", "test-user-123");

  try {
    const response = await fetch("http://localhost:3000/api/v1/chatbot", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return json({
      success: response.ok,
      status: response.status,
      data: result,
      intent,
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      intent,
    });
  }
};

export default function ChatConfig() {
  const { chatbot, availableModels, personalities } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [activeTab, setActiveTab] = useState("preview");
  const [chatbotData, setChatbotData] = useState(chatbot);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState(false);

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "conversations", label: "Conversaciones" },
    { id: "training", label: "Entrenamiento" },
    { id: "tasks", label: "Tareas" },
    { id: "code", label: "Código" },
    { id: "config", label: "Configuración" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setChatbotData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedModel = availableModels.find(
    (m) => m.value === chatbotData.aiModel
  );
  const selectedPersonality = personalities.find(
    (p) => p.value === chatbotData.personality
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-space-900">
      {/* Header */}
      <div className="bg-white dark:bg-space-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <IoArrowBack className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {chatbotData.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Toggle
                defaultValue={chatbotData.isActive}
                onChange={(value) => handleInputChange("isActive", value)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {chatbotData.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-space-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-space-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Estilo de tu chat
              </h2>

              {/* Avatar and Name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Avatar fill={chatbotData.primaryColor} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={chatbotData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: chatbotData.primaryColor }}
                  />
                  <input
                    type="color"
                    value={chatbotData.primaryColor}
                    onChange={(e) =>
                      handleInputChange("primaryColor", e.target.value)
                    }
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {chatbotData.primaryColor}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Configuration */}
            <div className="bg-white dark:bg-space-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Características de tu agente
              </h3>

              {/* AI Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecciona el modelo IA
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-space-700 text-left focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">AI</span>
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {selectedModel?.label || "Selecciona un modelo"}
                      </span>
                    </div>
                    <IoChevronDown className="w-5 h-5 text-gray-400" />
                  </button>

                  {showModelDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-space-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                      {availableModels.map((model) => (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => {
                            handleInputChange("aiModel", model.value);
                            setShowModelDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">
                              AI
                            </span>
                          </div>
                          <span className="text-gray-900 dark:text-white">
                            {model.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Personality Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Elige a tu agente
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPersonalityDropdown(!showPersonalityDropdown)
                    }
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-space-700 text-left focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar fill="#ED695F" />
                      <span className="text-gray-900 dark:text-white">
                        {selectedPersonality?.label ||
                          "Selecciona personalidad"}
                      </span>
                    </div>
                    <IoChevronDown className="w-5 h-5 text-gray-400" />
                  </button>

                  {showPersonalityDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-space-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                      {personalities.map((personality) => (
                        <button
                          key={personality.value}
                          type="button"
                          onClick={() => {
                            handleInputChange("personality", personality.value);
                            setShowPersonalityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Avatar fill="#ED695F" />
                          <span className="text-gray-900 dark:text-white">
                            {personality.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperatura
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Reservado
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Creativo
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={chatbotData.temperature}
                  onChange={(e) =>
                    handleInputChange("temperature", parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {chatbotData.temperature}
                  </span>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt general
                </label>
                <textarea
                  value={chatbotData.prompt}
                  onChange={(e) => handleInputChange("prompt", e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white text-sm"
                  placeholder="Describe cómo debe comportarse tu chatbot..."
                />
              </div>
            </div>

            {/* Save Button */}
            <Form method="post">
              <input type="hidden" name="intent" value="update_chatbot" />
              <input type="hidden" name="chatbotId" value={chatbotData.id} />
              <input type="hidden" name="name" value={chatbotData.name} />
              <input
                type="hidden"
                name="primaryColor"
                value={chatbotData.primaryColor}
              />
              <input type="hidden" name="aiModel" value={chatbotData.aiModel} />
              <input
                type="hidden"
                name="personality"
                value={chatbotData.personality}
              />
              <input type="hidden" name="prompt" value={chatbotData.prompt} />
              <input
                type="hidden"
                name="temperature"
                value={chatbotData.temperature}
              />

              <Button type="submit" className="w-full">
                💾 Guardar cambios
              </Button>
            </Form>
          </div>

          {/* Chat Preview */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white dark:bg-space-800 rounded-lg shadow overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8">
                    <Avatar fill={chatbotData.primaryColor} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {chatbotData.name}
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 p-4 space-y-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                {/* Bot Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex-shrink-0">
                    <Avatar fill={chatbotData.primaryColor} />
                  </div>
                  <div className="bg-white dark:bg-space-700 rounded-lg p-3 max-w-xs shadow-sm">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {chatbotData.welcomeMessage}
                    </p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-brand-500 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-white">
                      ¡Hola! ¿Cómo puedo ayudarte hoy?
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors"
                  >
                    <IoSend className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Result */}
            {actionData && (
              <div className="mt-4 p-4 bg-white dark:bg-space-800 rounded-lg shadow">
                <div
                  className={`text-sm ${
                    actionData.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {actionData.success
                    ? "✅ Cambios guardados exitosamente"
                    : "❌ Error al guardar cambios"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
