import { useState } from "react";
import { Link, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/chat.config";
import { Toggle } from "~/components/Switch";
import { Avatar } from "~/components/icons/Avatar";
import { data as json } from "react-router";
import { IoChevronDown, IoArrowBack, IoSend } from "react-icons/io5";
import { Effect, pipe } from "effect";
import { validateChatbotDataEffect } from "~/utils/zod";
import { useManualSave } from "~/hooks/useManualSave";
import { getUserOrRedirect } from "../server/getUserUtils";
import {
  createChatbot,
  getChatbotById,
  getChatbotsByUserId,
  getUserPlanFeatures,
  validateUserAIModelAccess,
} from "~/server/chatbot";
type Integration = any;
type User = any;
type Project = any;

export const meta = () => [
  { title: "Configuración del Chatbot - Formmy" },
  { name: "description", content: "Configura tu chatbot personalizado" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Obtener chatbotId de la URL si existe
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get("chatbotId");
  let chatbot = null;

  if (chatbotId) {
    chatbot = await getChatbotById(chatbotId);
    if (!chatbot || chatbot.userId !== user.id) {
      throw json(
        { error: "Chatbot no encontrado o sin permiso" },
        { status: 404 }
      );
    }
  } else {
    // Buscar el primer chatbot activo del usuario
    const chatbots = await getChatbotsByUserId(user.id);
    chatbot = chatbots.find((c) => c.isActive) || chatbots[0];
    // Si no tiene chatbots, crear uno por defecto
    if (!chatbot) {
      chatbot = await createChatbot({
        name: `${user.name || "Mi Chatbot"}`,
        userId: user.id,
        personality: "customer-service",
        welcomeMessage: "¡Hola! ¿Cómo puedo ayudarte hoy?",
        aiModel: "gpt-4o-mini",
        primaryColor: "#63CFDE",
        theme: "light",
        temperature: 0.7,
      });
    }
  }

  // Modelos y personalidades disponibles según el plan
  const modelAccess = await validateUserAIModelAccess(user.id);
  const planFeatures = await getUserPlanFeatures(user.id);

  // Personalidades (puedes ajustar según planFeatures si aplica)
  const personalities = [
    { value: "customer-service", label: "Agente de servicio al cliente" },
    { value: "sales-assistant", label: "Asistente de ventas" },
    { value: "technical-support", label: "Soporte técnico" },
    { value: "friendly-assistant", label: "Asistente amigable" },
  ];

  return json({
    chatbot,
    availableModels: modelAccess.availableModels.map((m) => ({
      value: m,
      label: m,
    })),
    personalities,
    planFeatures,
  });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Simular userId para pruebas (reemplazar por lógica real si aplica)
  formData.set("userId", "test-user-123");

  // Handler para actualizar configuración del chatbot
  const handleUpdateChatbotEffect = (formData: FormData, userId: string) =>
    pipe(
      Effect.tryPromise(async () => {
        // Convertir FormData a objeto
        const data = Object.fromEntries(formData.entries());
        // Obtener límites del plan (puedes obtenerlos del loader o de una llamada si es necesario)
        const planLimits = data.availableModels
          ? { availableModels: JSON.parse(data.availableModels as string) }
          : undefined;
        const parsed = validateChatbotDataEffect(
          {
            name: data.name,
            aiModel: data.aiModel,
            personality: data.personality,
            welcomeMessage: data.welcomeMessage,
            primaryColor: data.primaryColor,
            temperature: Number(data.temperature),
            prompt: data.prompt,
          },
          planLimits
        );
        if (!parsed.success) {
          throw new Error(JSON.stringify(parsed.error));
        }
        return formData;
      }),
      Effect.flatMap((data) =>
        Effect.tryPromise(async () => {
          const response = await fetch("http://localhost:3000/api/v1/chatbot", {
            method: "POST",
            body: data,
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Error al actualizar");
          return result;
        })
      ),
      Effect.catchAll((error) =>
        Effect.succeed({
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          intent,
        })
      )
    );

  // Handler para alternar estado activo/inactivo
  const handleToggleStatusEffect = (formData: FormData, userId: string) =>
    pipe(
      Effect.tryPromise(async () => {
        // Aquí podrías validar ownership, etc.
        return formData;
      }),
      Effect.flatMap((data) =>
        Effect.tryPromise(async () => {
          data.set("intent", "toggle_status");
          const response = await fetch("http://localhost:3000/api/v1/chatbot", {
            method: "POST",
            body: data,
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Error al alternar estado");
          return result;
        })
      ),
      Effect.catchAll((error) =>
        Effect.succeed({
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          intent,
        })
      )
    );

  // Determinar handler según intent
  let effect;
  if (intent === "update_chatbot") {
    effect = handleUpdateChatbotEffect(
      formData,
      formData.get("userId") as string
    );
  } else if (intent === "toggle_status") {
    effect = handleToggleStatusEffect(
      formData,
      formData.get("userId") as string
    );
  } else {
    // Fallback: intent no reconocido
    return json({
      success: false,
      error: `Intent no reconocido: ${intent}`,
      intent,
    });
  }

  // Ejecutar Effect y devolver resultado
  const result = await Effect.runPromise(effect);
  return json(result);
};

export default function ChatConfig() {
  const { chatbot, availableModels, personalities, planFeatures } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const manualSave = useManualSave(
    chatbot,
    { availableModels: availableModels.map((m) => m.value) },
    "update_chatbot"
  );

  const [activeTab, setActiveTab] = useState("preview");
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
    manualSave.handleChange(field, value);
  };

  const selectedModel = availableModels.find(
    (m) => m.value === manualSave.formData.aiModel
  );
  const selectedPersonality = personalities.find(
    (p) => p.value === manualSave.formData.personality
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
                {manualSave.formData.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Toggle
                defaultValue={manualSave.formData.isActive}
                onChange={(value) => handleInputChange("isActive", value)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {manualSave.formData.isActive ? "Activo" : "Inactivo"}
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
                  <Avatar
                    fill={manualSave.formData.primaryColor ?? "#63CFDE"}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={manualSave.formData.name}
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
                    style={{
                      backgroundColor:
                        manualSave.formData.primaryColor ?? undefined,
                    }}
                  />
                  <input
                    type="color"
                    value={manualSave.formData.primaryColor ?? undefined}
                    onChange={(e) =>
                      handleInputChange("primaryColor", e.target.value)
                    }
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {manualSave.formData.primaryColor ?? "#63CFDE"}
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
                  value={manualSave.formData?.temperature ?? 0.7}
                  onChange={(e) =>
                    handleInputChange("temperature", parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {manualSave.formData?.temperature ?? 0.7}
                  </span>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt general
                </label>
                <textarea
                  value={manualSave.formData?.prompt ?? ""}
                  onChange={(e) => handleInputChange("prompt", e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white text-sm"
                  placeholder="Describe cómo debe comportarse tu chatbot..."
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              className="w-full bg-brand-500 text-white py-2 px-4 rounded-md hover:bg-brand-600 transition-colors disabled:opacity-50"
              onClick={manualSave.handleSave}
              disabled={manualSave.isSaving || !manualSave.hasChanges}
            >
              {manualSave.isSaving ? "Guardando..." : "💾 Guardar cambios"}
            </button>
            {manualSave.success && (
              <div className="mt-2 text-green-600 dark:text-green-400 text-sm">
                Cambios guardados exitosamente
              </div>
            )}
            {manualSave.error && (
              <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
                Error:{" "}
                {typeof manualSave.error === "string"
                  ? manualSave.error
                  : JSON.stringify(manualSave.error)}
              </div>
            )}
            {manualSave.hasChanges && !manualSave.isSaving && (
              <div className="mt-2 text-yellow-600 dark:text-yellow-400 text-sm">
                Tienes cambios sin guardar
              </div>
            )}
            <button
              type="button"
              className="w-full mt-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={manualSave.resetChanges}
              disabled={manualSave.isSaving || !manualSave.hasChanges}
            >
              Descartar cambios
            </button>
          </div>

          {/* Chat Preview */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white dark:bg-space-800 rounded-lg shadow overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8">
                    <Avatar
                      fill={manualSave.formData.primaryColor ?? "#63CFDE"}
                    />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {manualSave.formData.name}
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 p-4 space-y-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                {/* Bot Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex-shrink-0">
                    <Avatar
                      fill={manualSave.formData.primaryColor ?? "#63CFDE"}
                    />
                  </div>
                  <div className="bg-white dark:bg-space-700 rounded-lg p-3 max-w-xs shadow-sm">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {manualSave.formData.welcomeMessage}
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
