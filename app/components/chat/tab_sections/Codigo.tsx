import { useState } from "react";
import { ConfigMenu, EmbebidoButton, IntegracionesButton } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import {
  Card,
  IntegrationCard,
  MiniCardGroup,
  type IntegrationStatus,
} from "../common/Card";
import { useChipTabs } from "../common/ChipTabs";
import { CodeBlock } from "../common/CodeBlock";
import { useApiKey } from "../../../hooks/useApiKey";
import type { Chatbot, Integration as PrismaIntegration } from "@prisma/client";
import WhatsAppIntegrationModal from "../../integrations/WhatsAppIntegrationModal";

// Integraciones disponibles con sus configuraciones
const availableIntegrations = [
  {
    id: "GOOGLE_CALENDAR",
    name: "Google Calendar",
    logo: "/assets/chat/calendar.png",
    description:
      "Conecta tu agente a Google Calendar para que pueda programar citas y recordatorios automáticamente.",
  },
  {
    id: "WHATSAPP",
    name: "WhatsApp",
    logo: "/assets/chat/whatsapp.svg",
    description:
      "Conecta a tu agente a un número de WhatsApp y deja que responda los mensajes de tus clientes.",
  },
  {
    id: "INSTAGRAM",
    name: "Instagram",
    logo: "/assets/chat/instagram.svg",
    description:
      "Conecta a tu agente a una página de Instagram y deja que responda los mensajes de tus clientes.",
  },
  {
    id: "MESSENGER",
    name: "Messenger",
    logo: "/assets/chat/messenger.svg",
    description:
      "Conecta a tu agente a tu fan page y deja que responda los mensajes de tus clientes.",
  },
  {
    id: "SHOPIFY",
    name: "Shopify",
    logo: "/assets/chat/shopify.svg",
    description:
      "Deje que tu agente interactúe con sus clientes, responda a sus consultas, ayude con los pedidos y más.",
  },
  {
    id: "WORDPRESS",
    name: "WordPress",
    logo: "/assets/chat/wordpress.svg",
    description:
      "Utiliza el plugin para Wordpress para agregar el widget de chat a su sitio web.",
  },
  {
    id: "SLACK",
    name: "Slack",
    logo: "/assets/chat/slack.svg",
    description:
      "Conecta a tu agente a Slack, menciónalo y haz que responda cualquier mensaje.",
  },
] as const;

// Extender el tipo de integración con propiedades adicionales si es necesario
type Integration = PrismaIntegration & {
  // Propiedades adicionales si son necesarias
};

// Extender el tipo Chatbot para incluir la propiedad slug
type ChatbotWithSlug = Chatbot & {
  slug: string;
  // Otras propiedades del chatbot que necesites
};

// Props del componente Codigo
interface CodigoProps {
  chatbot: ChatbotWithSlug;
  integrations: Integration[];
  user: {
    id: string;
    // Otras propiedades del usuario que necesites
  };
}

export const Codigo = ({ chatbot, integrations }: CodigoProps) => {
  const { currentTab, setCurrentTab } = useChipTabs("integrations");
  const { currentTab: miniCard, setCurrentTab: setMiniCard } =
    useChipTabs("iframe");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );
  // Estado para el estado de conexión de las integraciones
  const [integrationStatus, setIntegrationStatus] = useState<
    Record<string, IntegrationStatus>
  >(() => {
    const status: Record<string, IntegrationStatus> = {};

    // Debug: Verificar qué integraciones están llegando
    console.log("🔍 Debug - Integraciones recibidas:", integrations);
    console.log(
      "🔍 Debug - Cantidad de integraciones:",
      integrations?.length || 0
    );

    // Inicializar todas las integraciones disponibles como desconectadas
    availableIntegrations.forEach((availableIntegration) => {
      status[availableIntegration.id.toLowerCase()] = "disconnected";
    });

    // Verificar si hay integraciones existentes y actualizar su estado
    if (integrations && integrations.length > 0) {
      integrations.forEach((integration, index) => {
        console.log(`🔍 Debug - Integración ${index}:`, {
          id: integration.id,
          platform: integration.platform,
          isActive: integration.isActive,
          chatbotId: integration.chatbotId,
        });

        const platformKey = integration.platform.toLowerCase();

        // Si la integración existe pero está inactiva, mostrarla como desconectada
        // Si está activa, mostrarla como conectada
        const integrationStatus = integration.isActive
          ? "connected"
          : "disconnected";
        status[platformKey] = integrationStatus;

        console.log(
          `✅ Debug - ${integration.platform} encontrado, estado:`,
          integrationStatus,
          "(isActive:",
          integration.isActive,
          ")"
        );
      });
    } else {
      console.log("⚠️ Debug - No hay integraciones o array vacío");
    }

    console.log("🔍 Debug - Estado final de integraciones:", status);
    return status;
  });
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const handleConnect = (integrationId: string) => {
    console.log("🔍 Debug - Conectando integración:", integrationId);

    setIntegrationStatus((prev) => ({
      ...prev,
      [integrationId.toLowerCase()]: "connecting",
    }));

    // Para WhatsApp, abrir el modal de configuración
    if (integrationId === "WHATSAPP") {
      // Verificar si ya existe una integración de WhatsApp
      const existingWhatsAppIntegration = integrations?.find(
        (integration) => integration.platform === "WHATSAPP"
      );

      console.log(
        "🔍 Debug - Integración WhatsApp existente:",
        existingWhatsAppIntegration
      );

      setSelectedIntegration(integrationId);
      setIsWhatsAppModalOpen(true);

      // Resetear el estado a disconnected para que el modal maneje la conexión
      setIntegrationStatus((prev) => ({
        ...prev,
        [integrationId.toLowerCase()]: "disconnected",
      }));
    } else {
      // Para otras integraciones, simular conexión
      setTimeout(() => {
        setIntegrationStatus((prev) => ({
          ...prev,
          [integrationId.toLowerCase()]: "connected",
        }));
      }, 1000);
    }
  };

  const handleDisconnect = (integrationId: string) => {
    console.log("🔍 Debug - Desconectando integración:", integrationId);
    setIntegrationStatus((prev) => ({
      ...prev,
      [integrationId.toLowerCase()]: "disconnected",
    }));
  };

  const handleEdit = (integrationId: string) => {
    console.log("🔍 Debug - Editando integración:", integrationId);
    setSelectedIntegration(integrationId);
    if (integrationId === "WHATSAPP") {
      setIsWhatsAppModalOpen(true);
    }
  };

  // Manejador de éxito para la integración de WhatsApp
  const handleWhatsAppSuccess = (integration: any) => {
    console.log("🔍 Debug - WhatsApp integración exitosa:", integration);

    if (selectedIntegration) {
      // Actualizar el estado local
      setIntegrationStatus((prev) => ({
        ...prev,
        [selectedIntegration.toLowerCase()]: "connected" as const,
      }));

      setIsWhatsAppModalOpen(false);
      setSelectedIntegration(null);

      // Mostrar notificación de éxito
      // Aquí podrías usar tu sistema de notificaciones
      alert("¡Integración de WhatsApp configurada correctamente!");

      // Nota: En una aplicación real, podrías querer actualizar el estado
      // de las integraciones sin recargar la página, pero para este ejemplo
      // lo hacemos simple con una recarga
      window.location.reload();
    }
  };

  return (
    <StickyGrid>
      <section>
        <ConfigMenu>
          <EmbebidoButton
            current={currentTab}
            onClick={() => setCurrentTab("embed")}
          />
          <IntegracionesButton
            current={currentTab}
            onClick={() => setCurrentTab("integrations")}
          />
        </ConfigMenu>
      </section>
      {currentTab === "embed" && (
        <section>
          <Card
            title="Embebe tu chatbot en tu sitio web"
            text={
              <div>
                <p className="text-metal font-light">
                  Elige la forma de embebido que más te convenga.{" "}
                  <a href="#!" className="underline">
                    Más información
                  </a>
                </p>
              </div>
            }
          >
            <section>
              <MiniCardGroup selectedMinicard={miniCard} onSelect={setMiniCard}>
                {miniCard === "sdk" && <SDK chatbot={chatbot} />}
                {miniCard === "iframe" && <Iframe chatbot={chatbot} />}
                {miniCard === "link" && <LinkBlock chatbot={chatbot} />}
              </MiniCardGroup>
            </section>
          </Card>
        </section>
      )}
      {currentTab === "integrations" && (
        <article className="grid lg:grid-cols-3 grid-cols-1 md:grid-cols-2 gap-4 py-3">
          {availableIntegrations.map((availableIntegration) => {
            const existingIntegration = integrations.find(
              (i) => i.platform === availableIntegration.id
            );

            return (
              <IntegrationCard
                integration={existingIntegration}
                key={availableIntegration.id}
                name={availableIntegration.name}
                logo={availableIntegration.logo}
                description={availableIntegration.description}
                lastActivity={
                  integrationStatus[availableIntegration.id.toLowerCase()] ===
                  "connected"
                    ? "Hoy"
                    : undefined
                }
                onConnect={() => handleConnect(availableIntegration.id)}
                onDisconnect={() => handleDisconnect(availableIntegration.id)}
                onEdit={() => handleEdit(availableIntegration.id)}
              />
            );
          })}

          {selectedIntegration === "WHATSAPP" && (
            <WhatsAppIntegrationModal
              isOpen={isWhatsAppModalOpen}
              onClose={() => setIsWhatsAppModalOpen(false)}
              onSuccess={handleWhatsAppSuccess}
              chatbotId={chatbot.id}
              existingIntegration={(() => {
                const whatsappIntegration = integrations.find(
                  (integration) => integration.platform === "WHATSAPP"
                );
                if (!whatsappIntegration) return null;

                return {
                  id: whatsappIntegration.id,
                  phoneNumberId: whatsappIntegration.phoneNumberId || "",
                  businessAccountId:
                    whatsappIntegration.businessAccountId || "",
                  webhookVerifyToken:
                    whatsappIntegration.webhookVerifyToken || undefined,
                };
              })()}
            />
          )}
        </article>
      )}
    </StickyGrid>
  );
};

interface LinkBlockProps {
  chatbot: {
    slug: string;
  };
}

const LinkBlock = ({ chatbot }: LinkBlockProps) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://formmy-v2.fly.dev";
  const chatUrl = `${baseUrl}/chat/embed?slug=${chatbot.slug}`;

  const codeToCopy = `
<a href="${chatUrl}" target="_blank" rel="noopener noreferrer">
  Chatear con nuestro asistente
</a>
`;

  const instructions = [
    { step: "1", description: "Copia el código del enlace" },
    {
      step: "2",
      description: "Pégalo en tu archivo HTML donde quieras que aparezca",
    },
    {
      step: "3",
      description: "Personaliza el texto y los estilos según tus necesidades",
    },
  ];

  return (
    <CodeBlock
      title="Enlace directo"
      language="html"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};

const Iframe = ({ chatbot }: { chatbot: { slug: string } }) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://formmy-v2.fly.dev";

  const codeToCopy = `
<article style="background:transparent;position:fixed;bottom:40px;right:40px;">
  <iframe 
    src="${baseUrl}/chat/embed?slug=${chatbot.slug}" 
    width="400" 
    height="600"
    frameborder="0"
    style="border-radius: 8px;"
  ></iframe>
</article>
`;

  const instructions = [
    { step: "1", description: "Copia el código del iframe" },
    {
      step: "2",
      description: "Pégalo en tu archivo HTML donde quieras que aparezca",
    },
    {
      step: "3",
      description: "Ajusta el width y height según tus necesidades",
    },
    {
      step: "4",
      description:
        "El chatbot se adaptará automáticamente y ocupará todo el espacio disponible",
    },
    {
      step: "5",
      description:
        "La ruta /chat/embed usa el slug de tu chatbot para mostrarlo correctamente",
    },
  ];

  return (
    <CodeBlock
      title="Iframe embebido"
      language="html"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};

interface SDKProps {
  chatbot: {
    id: string;
    slug: string;
  };
}

const SDK = ({ chatbot }: SDKProps) => {
  const { apiKeyData, loading, error, refetch } = useApiKey({
    chatbotId: chatbot.id,
  });

  // Generate the correct script URL with the user's API key
  const getScriptUrl = () => {
    if (!apiKeyData) return "";
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://yourdomain.com";
    return `${baseUrl}/api/sdk/${apiKeyData.key}.js`;
  };

  const codeToCopy = apiKeyData
    ? `<!-- SDK Script - Configuración automática -->
<script src="${getScriptUrl()}"></script>`
    : "";

  const instructions = [
    { step: "1", description: "Copia el código del SDK" },
    {
      step: "2",
      description:
        "Pégalo en tu archivo HTML antes de cerrar la etiqueta </body>",
    },
    {
      step: "3",
      description:
        "El widget de chat aparecerá automáticamente en tu sitio web",
    },
    {
      step: "4",
      description:
        "Personaliza el tema y posición usando los atributos data-theme y data-position",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generando API key...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">
          SDK temporalmente no disponible: {error}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!apiKeyData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">SDK temporalmente no disponible</p>
        <p className="text-yellow-600">
          Usa el iframe o enlace directo por ahora
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CodeBlock
        title="SDK de JavaScript"
        language="html"
        code={codeToCopy}
        instructions={instructions}
      />

      {/* API Key Info */}
      <div className="p-4 bg-cloud/20 border border-cloud rounded-2xl">
        <h4 className="font-semibold text-dark mb-2">
          Información de tu API Key
        </h4>
        <div className="space-y-1 text-sm text-metal">
          <p>
            <strong>Nombre:</strong> {apiKeyData.name}
          </p>
          <p>
            <strong>Tipo:</strong> {apiKeyData.keyType}
          </p>
          <p>
            <strong>Límite por hora:</strong>{" "}
            {apiKeyData.rateLimit ? apiKeyData.rateLimit.toLocaleString() : "0"}{" "}
            requests
          </p>
          <p>
            <strong>Requests este mes:</strong>{" "}
            {apiKeyData.monthlyRequests
              ? apiKeyData.monthlyRequests.toLocaleString()
              : "0"}
          </p>
          <p>
            <strong>Total requests:</strong>{" "}
            {apiKeyData.requestCount
              ? apiKeyData.requestCount.toLocaleString()
              : "0"}
          </p>
          <p>
            <strong>Estado:</strong>
            <span
              className={`ml-1 px-2 py-1 rounded text-xs ${
                apiKeyData.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {apiKeyData.isActive ? "Activa" : "Inactiva"}
            </span>
          </p>
          {apiKeyData.lastUsedAt && (
            <p>
              <strong>Último uso:</strong>{" "}
              {new Date(apiKeyData.lastUsedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Options */}
      <div className="p-4 bg-bird/20 border border-bird rounded-2xl">
        <h4 className="font-semibold text-gray-900 mb-2">
          Opciones de configuración
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <strong>data-chatbot:</strong> Especifica qué chatbot usar
            <code className="ml-2 px-2 py-1 bg-bird rounded text-xs">
              data-chatbot="{chatbot.slug}"
            </code>
          </div>
          <div>
            <strong>data-theme:</strong> Tema del widget
            <div className="ml-4 mt-1">
              <code className="px-2 py-1 bg-bird rounded text-xs mr-2">
                data-theme="light"
              </code>
              <code className="px-2 py-1 bg-bird rounded text-xs">
                data-theme="dark"
              </code>
            </div>
          </div>
          <div>
            <strong>data-position:</strong> Posición del widget
            <div className="ml-4 mt-1 space-x-2">
              <code className="px-2 py-1 bg-bird rounded text-xs">
                data-position="bottom-right"
              </code>
              <code className="px-2 py-1 bg-bird rounded text-xs">
                data-position="bottom-left"
              </code>
            </div>
            <div className="ml-4 mt-1 space-x-2">
              <code className="px-2 py-1 bg-bird rounded text-xs">
                data-position="top-right"
              </code>
              <code className="px-2 py-1 bg-bird rounded text-xs">
                data-position="top-left"
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="p-4 bg-grass/20 border border-grass rounded-2xl">
        <h4 className="font-semibold text-dark mb-2">
          Ejemplo de uso completo
        </h4>
        <pre className="text-sm text-metal p-3 rounded overflow-x-auto">
          {`<!DOCTYPE html>
<html>
<head>
  <title>Mi sitio web</title>
</head>
<body>
  <!-- Tu contenido aquí -->
  
  <!-- SDK de Formmy Chat -->
  <script 
    src="${getScriptUrl()}" 
    data-chatbot="${chatbot.slug}"
    data-theme="light"
    data-position="bottom-right">
  </script>
</body>
</html>`}
        </pre>
      </div>
    </div>
  );
};
