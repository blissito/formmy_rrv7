import { useState, useEffect } from "react";
import { Link, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/chat.config";
import { Toggle } from "~/components/Switch";
import { Avatar } from "~/components/icons/Avatar";
import { data as json } from "react-router";
import { IoChevronDown, IoArrowBack, IoSend } from "react-icons/io5";
import { Effect, pipe } from "effect";
import { validateChatbotDataEffect } from "~/utils/zod";
import { useManualSave } from "~/hooks/useManualSave";
import { getUserOrRedirect } from "server/getUserUtils.server";
import {
  createChatbot,
  getChatbotById,
  getChatbotsByUserId,
  getUserPlanFeatures,
  validateUserAIModelAccess,
} from "server/chatbot/index.server";
import { ValidationMessage } from "~/components/ui/ValidationMessage";
import ChatPreview from "../components/ChatPreview";
import { sendOpenRouterMessageEffect } from "../lib/openrouter.client";
import { AI_MODELS, MODEL_LABELS, DEFAULT_AI_MODEL } from "~/utils/aiModels";
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
        aiModel: DEFAULT_AI_MODEL,
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

  // Lista de modelos populares para chatbots
  const allModels = AI_MODELS;
  const modelLabels = MODEL_LABELS;

  // Crear lista de todos los modelos con información de disponibilidad
  const availableModels = allModels.map((model) => {
    // Si es modelo free, siempre disponible
    if (model.category === "Free") {
      return { ...model, isAvailable: true };
    }
    // Si es modelo de pago, depende del plan
    return {
      ...model,
      isAvailable: modelAccess.availableModels.includes(model.value),
    };
  });

  return json({
    chatbot,
    availableModels,
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
            instructions: data.instructions,
            isActive: data.isActive, // <-- enviar isActive
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
  const defaultChatbot = {
    id: "",
    chatbotId: "",
    name: "",
    description: "",
    personality: "customer-service",
    welcomeMessage: "¡Hola! ¿Cómo puedo ayudarte hoy?",
    aiModel: DEFAULT_AI_MODEL,
    primaryColor: "#63CFDE",
    theme: "light",
    temperature: 0.7,
    instructions: "", // <-- usar instructions
    isActive: false,
  };
  const manualSave = useManualSave({
    initialData: { ...defaultChatbot, ...chatbot, chatbotId: chatbot?.id },
    validate: validateChatbotDataEffect,
    endpoint: "/api/v1/chatbot",
    intent: "update_chatbot",
    idField: "chatbotId",
    planLimits: { availableModels: availableModels.map((m) => m.value) },
  });

  const [activeTab, setActiveTab] = useState("preview");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".model-dropdown") &&
        !target.closest(".personality-dropdown")
      ) {
        setShowModelDropdown(false);
        setShowPersonalityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Eliminar toda la lógica y estado de chat local

  // Mostrar mensaje de éxito temporal
  useEffect(() => {
    if (manualSave.success) {
      setShowSuccess(true);
      const timeout = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [manualSave.success]);

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "conversations", label: "Conversaciones" },
    { id: "training", label: "Entrenamiento" },
    { id: "tasks", label: "Tareas" },
    { id: "code", label: "Código" },
    { id: "config", label: "Configuración" },
  ];

  const handleInputChange = (field: string, value: any) => {
    // Si el campo es name/id, asegúrate de que chatbotId se mantenga
    if (field === "id" || field === "chatbotId") {
      manualSave.handleChange("chatbotId", value);
    } else {
      manualSave.handleChange(field, value);
    }
  };

  const selectedModel = availableModels.find(
    (m) => m.value === (manualSave.formData?.aiModel ?? "")
  );
  const selectedPersonality = personalities.find(
    (p) => p.value === (manualSave.formData?.personality ?? "")
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
                {manualSave.formData?.name ?? "Mi Chatbot"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Toggle
                defaultValue={manualSave.formData?.isActive ?? false}
                onChange={(value) => handleInputChange("isActive", value)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {manualSave.formData?.isActive ? "Activo" : "Inactivo"}
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
                    fill={manualSave.formData?.primaryColor ?? "#63CFDE"}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={manualSave.formData?.name ?? ""}
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
                        manualSave.formData?.primaryColor ?? undefined,
                    }}
                  />
                  <input
                    type="color"
                    value={manualSave.formData?.primaryColor ?? undefined}
                    onChange={(e) =>
                      handleInputChange("primaryColor", e.target.value)
                    }
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {manualSave.formData?.primaryColor ?? "#63CFDE"}
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
                <div className="relative model-dropdown">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-space-700 text-left focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">AI</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {selectedModel?.label || "Selecciona un modelo"}
                        </span>
                        {selectedModel && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedModel.value}
                          </span>
                        )}
                      </div>
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
                            if (model.isAvailable) {
                              handleInputChange("aiModel", model.value);
                              setShowModelDropdown(false);
                            }
                          }}
                          disabled={!model.isAvailable}
                          className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                            !model.isAvailable
                              ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-600"
                          } ${
                            selectedModel?.value === model.value
                              ? "bg-brand-50 dark:bg-brand-900/20"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              model.isAvailable ? "bg-brand-500" : "bg-gray-400"
                            }`}
                          >
                            <span className="text-xs text-white font-bold">
                              AI
                            </span>
                          </div>
                          <div className="flex flex-col items-start flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${
                                  model.isAvailable
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {model.label}
                              </span>
                              {!model.isAvailable && (
                                <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                  PRO
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {model.value}
                            </span>
                          </div>
                          {selectedModel?.value === model.value &&
                            model.isAvailable && (
                              <div className="ml-auto">
                                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                              </div>
                            )}
                          {!model.isAvailable && (
                            <div className="ml-auto">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}

                      {/* Mensaje informativo sobre modelos PRO */}
                      {availableModels.some((m) => !m.isAvailable) && (
                        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              Los modelos marcados con{" "}
                              <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1 rounded">
                                PRO
                              </span>{" "}
                              requieren actualizar tu plan
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Personality Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Elige a tu agente
                </label>
                <div className="relative personality-dropdown">
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
                  value={manualSave.formData?.instructions ?? ""}
                  onChange={(e) =>
                    handleInputChange("instructions", e.target.value)
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white text-sm"
                  placeholder="Describe cómo debe comportarse tu chatbot..."
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              className={`w-full bg-brand-500 text-white py-2 px-4 rounded-md hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                manualSave.hasChanges ? "ring-2 ring-yellow-400" : ""
              }`}
              onClick={manualSave.handleSave}
              disabled={manualSave.isSaving || !manualSave.hasChanges}
            >
              {manualSave.isSaving && (
                <span className="animate-spin mr-2">
                  <svg
                    className="w-5 h-5 text-white"
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
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                </span>
              )}
              {manualSave.isSaving ? "Guardando..." : "💾 Guardar cambios"}
            </button>
            {showSuccess && (
              <ValidationMessage
                type="success"
                message="Cambios guardados exitosamente"
              />
            )}
            {manualSave.error && (
              <ValidationMessage
                type="error"
                message={
                  typeof manualSave.error === "string"
                    ? manualSave.error
                    : JSON.stringify(manualSave.error)
                }
              />
            )}
            {manualSave.hasChanges && !manualSave.isSaving && (
              <ValidationMessage
                type="warning"
                message="Tienes cambios sin guardar"
              />
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
            {activeTab === "preview" && (
              <ChatPreview
                model={manualSave.formData?.aiModel}
                instructions={
                  manualSave.formData?.instructions ||
                  manualSave.formData?.welcomeMessage ||
                  ""
                }
                temperature={manualSave.formData?.temperature ?? 0.7}
                primaryColor={manualSave.formData?.primaryColor || undefined}
                name={manualSave.formData?.name ?? "Mi Ghosty bot"}
                avatarComponent={
                  <Avatar
                    fill={manualSave.formData?.primaryColor ?? "#63CFDE"}
                  />
                }
                welcomeMessage={
                  manualSave.formData?.welcomeMessage || undefined
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
