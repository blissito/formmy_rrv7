import { useState } from "react";
import { Form, useActionData } from "react-router";
import type { Route } from "./+types/chatbot-test";
import { Button } from "~/components/Button";
import { Toggle } from "~/components/Switch";
import Modal from "~/components/Modal";
import { data as json } from "react-router";

export const meta = () => [
  { title: "Chatbot API Test" },
  {
    name: "description",
    content: "Página de pruebas para los endpoints del chatbot",
  },
];

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const endpoint = formData.get("endpoint") as string;
  const intent = formData.get("intent") as string;

  // Simular userId para pruebas
  formData.set("userId", "test-user-123");

  try {
    const response = await fetch(`http://localhost:3000/api/v1/${endpoint}`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return json({
      success: response.ok,
      status: response.status,
      data: result,
      endpoint,
      intent,
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      endpoint,
      intent,
    });
  }
};

export default function ChatbotTest() {
  const actionData = useActionData<typeof action>();
  const [selectedEndpoint, setSelectedEndpoint] = useState("chatbot");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [showModal, setShowModal] = useState(false);

  const endpoints = {
    chatbot: [
      "create_chatbot",
      "update_chatbot",
      "get_chatbot",
      "get_chatbot_by_slug",
      "get_user_chatbots",
      "delete_chatbot",
      "activate_chatbot",
      "deactivate_chatbot",
      "set_to_draft",
      "get_chatbot_state",
      "get_usage_stats",
      "check_monthly_limit",
      "get_plan_features",
      "get_branding_config",
    ],
    context: [
      "add_file_context",
      "add_url_context",
      "add_text_context",
      "remove_context",
      "get_contexts",
    ],
    conversation: [
      "create_conversation",
      "get_conversation",
      "get_conversation_by_session",
      "get_chatbot_conversations",
      "update_conversation_status",
    ],
    messages: ["add_user_message", "add_assistant_message", "get_messages"],
    integration: [
      "create_integration",
      "get_integrations",
      "update_integration",
      "toggle_integration",
      "delete_integration",
    ],
    export: ["export_conversations"],
  };

  const getFormFields = (endpoint: string, intent: string) => {
    const commonFields = {
      chatbot: {
        create_chatbot: [
          "name",
          "description",
          "personality",
          "welcomeMessage",
          "aiModel",
          "primaryColor",
          "theme",
          "temperature",
        ],
        update_chatbot: [
          "chatbotId",
          "name",
          "description",
          "personality",
          "welcomeMessage",
          "aiModel",
          "primaryColor",
          "theme",
          "temperature",
        ],
        get_chatbot: ["chatbotId"],
        get_chatbot_by_slug: ["slug"],
        delete_chatbot: ["chatbotId"],
        activate_chatbot: ["chatbotId"],
        deactivate_chatbot: ["chatbotId"],
        set_to_draft: ["chatbotId"],
        get_chatbot_state: ["chatbotId"],
        get_usage_stats: ["chatbotId"],
        check_monthly_limit: ["chatbotId"],
        get_branding_config: ["chatbotId"],
      },
      context: {
        add_file_context: [
          "chatbotId",
          "fileName",
          "fileType",
          "fileUrl",
          "sizeKB",
          "content",
        ],
        add_url_context: ["chatbotId", "url", "title", "content", "sizeKB"],
        add_text_context: ["chatbotId", "title", "content"],
        remove_context: ["chatbotId", "contextId"],
        get_contexts: ["chatbotId"],
      },
      conversation: {
        create_conversation: ["chatbotId", "visitorIp", "visitorId"],
        get_conversation: ["conversationId"],
        get_conversation_by_session: ["sessionId"],
        get_chatbot_conversations: ["chatbotId"],
        update_conversation_status: ["conversationId", "status"],
      },
      messages: {
        add_user_message: ["conversationId", "content", "visitorIp"],
        add_assistant_message: [
          "conversationId",
          "content",
          "tokens",
          "responseTime",
        ],
        get_messages: ["conversationId"],
      },
      integration: {
        create_integration: ["chatbotId", "platform", "token"],
        get_integrations: ["chatbotId"],
        update_integration: ["integrationId", "token", "isActive"],
        toggle_integration: ["integrationId", "isActive"],
        delete_integration: ["integrationId"],
      },
      export: {
        export_conversations: [
          "chatbotId",
          "format",
          "startDate",
          "endDate",
          "includeMessages",
        ],
      },
    };

    return (
      commonFields[endpoint as keyof typeof commonFields]?.[
        intent as keyof any
      ] || []
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-space-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-space-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            🤖 Chatbot API Test
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panel de configuración */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endpoint
                </label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => {
                    setSelectedEndpoint(e.target.value);
                    setSelectedIntent("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white"
                >
                  {Object.keys(endpoints).map((endpoint) => (
                    <option key={endpoint} value={endpoint}>
                      /api/v1/{endpoint}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intent
                </label>
                <select
                  value={selectedIntent}
                  onChange={(e) => setSelectedIntent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white"
                >
                  <option value="">Selecciona un intent</option>
                  {endpoints[selectedEndpoint as keyof typeof endpoints].map(
                    (intent) => (
                      <option key={intent} value={intent}>
                        {intent}
                      </option>
                    )
                  )}
                </select>
              </div>

              {selectedIntent && (
                <Form method="post" className="space-y-4">
                  <input
                    type="hidden"
                    name="endpoint"
                    value={selectedEndpoint}
                  />
                  <input type="hidden" name="intent" value={selectedIntent} />

                  <div className="bg-gray-50 dark:bg-space-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Parámetros para {selectedIntent}
                    </h3>

                    {getFormFields(selectedEndpoint, selectedIntent).map(
                      (field) => (
                        <div key={field} className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field}
                          </label>
                          {field === "isActive" ? (
                            <Toggle name={field} />
                          ) : field === "status" ? (
                            <select
                              name={field}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-600 dark:text-white text-sm"
                            >
                              <option value="">Selecciona estado</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="TIMEOUT">TIMEOUT</option>
                            </select>
                          ) : field === "platform" ? (
                            <select
                              name={field}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-600 dark:text-white text-sm"
                            >
                              <option value="">Selecciona plataforma</option>
                              <option value="WHATSAPP">WHATSAPP</option>
                              <option value="TELEGRAM">TELEGRAM</option>
                            </select>
                          ) : field === "format" ? (
                            <select
                              name={field}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-600 dark:text-white text-sm"
                            >
                              <option value="">Selecciona formato</option>
                              <option value="csv">CSV</option>
                              <option value="json">JSON</option>
                            </select>
                          ) : field === "aiModel" ? (
                            <select
                              name={field}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-600 dark:text-white text-sm"
                            >
                              <option value="">Selecciona modelo</option>
                              <option value="mistralai/mistral-small-3.2-24b-instruct">
                                Mistral Small
                              </option>
                              <option value="gpt-4o-mini">GPT-4o Mini</option>
                              <option value="anthropic/claude-3-haiku-20240307">
                                Claude Haiku
                              </option>
                            </select>
                          ) : (
                            <input
                              type={
                                field.includes("Date")
                                  ? "date"
                                  : field.includes("KB") ||
                                    field.includes("tokens") ||
                                    field.includes("Time")
                                  ? "number"
                                  : "text"
                              }
                              name={field}
                              placeholder={`Ingresa ${field}`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-600 dark:text-white text-sm"
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    🚀 Probar API
                  </Button>
                </Form>
              )}
            </div>

            {/* Panel de resultados */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-space-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  📊 Resultado de la prueba
                </h3>

                {actionData ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          actionData.success
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {actionData.success ? "✅ Éxito" : "❌ Error"}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Status: {actionData.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Endpoint:{" "}
                        <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">
                          /api/v1/{actionData.endpoint}
                        </code>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Intent:{" "}
                        <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">
                          {actionData.intent}
                        </code>
                      </p>
                    </div>

                    <div>
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                      >
                        📋 Ver respuesta completa
                      </button>
                    </div>

                    {showModal && (
                      <Modal
                        title="Respuesta de la API"
                        onClose={() => setShowModal(false)}
                        size="lg"
                      >
                        <div className="pb-6">
                          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(actionData.data, null, 2)}
                          </pre>
                        </div>
                      </Modal>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Selecciona un endpoint e intent, luego haz clic en "Probar
                    API" para ver los resultados aquí.
                  </p>
                )}
              </div>

              {/* Información de ayuda */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  💡 Información de ayuda
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>
                    • Todos los endpoints requieren un userId (se añade
                    automáticamente en las pruebas)
                  </li>
                  <li>
                    • Los campos marcados como requeridos deben completarse
                  </li>
                  <li>
                    • Algunos endpoints requieren que existan recursos previos
                    (ej: chatbotId)
                  </li>
                  <li>• Los errores 403 indican problemas de permisos</li>
                  <li>• Los errores 404 indican que el recurso no existe</li>
                </ul>
              </div>

              {/* Ejemplos de IDs para pruebas */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                  🔧 IDs de ejemplo para pruebas
                </h4>
                <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  <p>
                    <strong>chatbotId:</strong>{" "}
                    <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                      test-chatbot-123
                    </code>
                  </p>
                  <p>
                    <strong>conversationId:</strong>{" "}
                    <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                      test-conversation-123
                    </code>
                  </p>
                  <p>
                    <strong>contextId:</strong>{" "}
                    <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                      test-context-123
                    </code>
                  </p>
                  <p>
                    <strong>sessionId:</strong>{" "}
                    <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                      test-session-123
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
