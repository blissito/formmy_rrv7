import { useLoaderData } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getChatbotBySlug } from "server/chatbot/chatbotModel.server";
import { PageContainer } from "~/components/chat/PageContainer";
import { ConfigMenu } from "~/components/chat/ConfigMenu";
import { useState } from "react";
import { HiEye, HiCog, HiClipboardList } from "react-icons/hi";
import { HiCpuChip } from "react-icons/hi2";
import type { Route } from "./+types/chat_.$chatbotSlug";

/**
 * Loader function for the chatbot detail route
 */
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const { chatbotSlug } = params;

  if (!chatbotSlug) {
    throw new Response("Chatbot slug is required", { status: 400 });
  }

  const chatbot = await getChatbotBySlug(chatbotSlug);

  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  // Verificar que el chatbot pertenece al usuario
  if (chatbot.userId !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return { user, chatbot };
};

/**
 * Main component for the chatbot detail route
 */
export default function ChatbotDetailRoute() {
  const { user, chatbot } = useLoaderData<typeof loader>();
  const [currentTab, setCurrentTab] = useState("preview");

  const handleTabClick = (tabName: string) => () => {
    setCurrentTab(tabName);
  };

  return (
    <PageContainer>
      <PageContainer.Title back="/chat">{chatbot.name}</PageContainer.Title>
      <PageContainer.Header user={user} />
      <PageContainer.StickyGrid>
        <ConfigMenu current={currentTab}>
          <ConfigMenu.MenuButton
            isActive={currentTab === "preview"}
            onClick={handleTabClick("preview")}
            icon={<HiEye />}
          >
            Preview
          </ConfigMenu.MenuButton>
          <ConfigMenu.MenuButton
            isActive={currentTab === "conversations"}
            onClick={handleTabClick("conversations")}
            src="/assets/chat/message.svg"
          >
            Conversaciones
          </ConfigMenu.MenuButton>
          <ConfigMenu.MenuButton
            isActive={currentTab === "training"}
            onClick={handleTabClick("training")}
            icon={<HiCpuChip />}
          >
            Entrenamiento
          </ConfigMenu.MenuButton>
          <ConfigMenu.MenuButton
            isActive={currentTab === "tasks"}
            onClick={handleTabClick("tasks")}
            icon={<HiClipboardList />}
          >
            Tareas
          </ConfigMenu.MenuButton>
          <ConfigMenu.MenuButton
            isActive={currentTab === "code"}
            onClick={handleTabClick("code")}
            src="/assets/chat/code.svg"
          >
            Código
          </ConfigMenu.MenuButton>
          <ConfigMenu.MenuButton
            isActive={currentTab === "config"}
            onClick={handleTabClick("config")}
            icon={<HiCog />}
          >
            Configuración
          </ConfigMenu.MenuButton>
        </ConfigMenu>

        {currentTab === "preview" && <PreviewTab chatbot={chatbot} />}
        {currentTab === "conversations" && <ConversationsTab />}
        {currentTab === "training" && <TrainingTab />}
        {currentTab === "tasks" && <TasksTab />}
        {currentTab === "code" && <CodeTab />}
        {currentTab === "config" && <ConfigTab chatbot={chatbot} />}
      </PageContainer.StickyGrid>
    </PageContainer>
  );
}

// Componente para el tab de Preview
const PreviewTab = ({ chatbot }: { chatbot: any }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Panel de configuración del chat */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Estilo de tu chat</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={chatbot.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: chatbot.primaryColor || "#6366F1" }}
                />
                <span className="text-sm text-gray-600">
                  {chatbot.primaryColor || "#6366F1"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Saludo inicial</h3>
          <textarea
            value={chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            readOnly
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Despedida</h3>
          <textarea
            value="Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            readOnly
          />
        </div>
      </div>

      {/* Preview del chat */}
      <div className="bg-gray-100 rounded-2xl p-6">
        <div className="bg-white rounded-xl shadow-lg max-w-sm mx-auto">
          {/* Header del chat */}
          <div className="bg-gray-50 rounded-t-xl p-4 border-b">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: chatbot.primaryColor || "#6366F1" }}
              >
                {chatbot.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-800">{chatbot.name}</span>
            </div>
          </div>

          {/* Mensajes del chat */}
          <div className="p-4 space-y-4 min-h-[300px]">
            {/* Mensaje del bot */}
            <div className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: chatbot.primaryColor || "#6366F1" }}
              >
                {chatbot.name.charAt(0).toUpperCase()}
              </div>
              <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[200px]">
                <p className="text-sm text-gray-800">
                  {chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?"}
                </p>
              </div>
            </div>
          </div>

          {/* Input del chat */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
              <button
                className="p-2 rounded-full text-white"
                style={{ backgroundColor: chatbot.primaryColor || "#6366F1" }}
                disabled
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Powered by Formmy.app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes placeholder para otros tabs
const ConversationsTab = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Conversaciones</h3>
    <p className="text-gray-600">
      Aquí verás todas las conversaciones de tu chatbot
    </p>
  </div>
);

const TrainingTab = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Entrenamiento</h3>
    <p className="text-gray-600">Configura el entrenamiento de tu chatbot</p>
  </div>
);

const TasksTab = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Tareas</h3>
    <p className="text-gray-600">Gestiona las tareas automatizadas</p>
  </div>
);

const CodeTab = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Código</h3>
    <p className="text-gray-600">Obtén el código para integrar tu chatbot</p>
  </div>
);

const ConfigTab = ({ chatbot }: { chatbot: any }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-8">
    <h3 className="text-lg font-semibold mb-4">Configuración</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modelo de IA
        </label>
        <p className="text-sm text-gray-600">{chatbot.aiModel}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperatura
        </label>
        <p className="text-sm text-gray-600">{chatbot.temperature}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado
        </label>
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            chatbot.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {chatbot.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>
    </div>
  </div>
);

export const meta = ({ data }: { data: any }) => {
  if (!data?.chatbot) {
    return [
      { title: "Chatbot Not Found" },
      {
        name: "description",
        content: "The requested chatbot could not be found",
      },
    ];
  }

  return [
    { title: `${data.chatbot.name} - Chatbot` },
    {
      name: "description",
      content: `Configure and manage your chatbot: ${data.chatbot.name}`,
    },
  ];
};
