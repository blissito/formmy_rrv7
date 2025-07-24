import { useLoaderData } from "react-router";
import { ConfigMenu, EmbebidoButton, IntegracionesButton } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import { Card, IntegrationCard, MiniCardGroup } from "../common/Card";
import { useChipTabs } from "../common/ChipTabs";
import { CodeBlock } from "../common/CodeBlock";
import { useApiKey } from "../../../hooks/useApiKey";
import type { Chatbot } from "@prisma/client";

export const Codigo = () => {
  const { currentTab, setCurrentTab } = useChipTabs("embed");
  const { currentTab: miniCard, setCurrentTab: setMiniCard } =
    useChipTabs("sdk");

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
                <p>
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
                {miniCard === "sdk" && <SDK />}
                {miniCard === "iframe" && <Iframe />}
                {miniCard === "link" && <LinkBlock />}
              </MiniCardGroup>
            </section>
          </Card>
        </section>
      )}
      {currentTab === "integrations" && (
        <article className="grid lg:grid-cols-3 grid-cols-2 gap-4 py-3">
          <IntegrationCard
            description="Conecta a tu agente a un número de WhatsApp y deja que responda los mensajes de tus clientes."
            name="Whatsapp"
            logo="/assets/chat/whatsapp.svg"
          />
          <IntegrationCard
            description="Conecta a tu agente a una página de Instagram y deja que responda los mensajes de tus clientes."
            name="Instagram"
            logo="/assets/chat/instagram.svg"
          />
          <IntegrationCard
            description="Conecta a tu agente a tu fan page y deja que responda los mensajes de tus clientes."
            name="Messenger"
            logo="/assets/chat/messenger.svg"
          />
          <IntegrationCard
            description="Deje que tu agente interactúe con sus clientes, responda a sus consultas, ayude con los pedidos y más."
            name="Shopify"
            logo="/assets/chat/shopify.svg"
          />
          <IntegrationCard
            description="Utiliza el plugin para Wordpress para agregar el widget de chat a su sitio web."
            name="Wordpress"
            logo="/assets/chat/wordpress.svg"
          />
          <IntegrationCard
            description="Conecta a tu agente a Slack, menciónalo y haz que responda cualquier mensaje."
            name="Slack"
            logo="/assets/chat/slack.svg"
          />
        </article>
      )}
    </StickyGrid>
  );
};

const LinkBlock = () => {
  const { chatbot } = useLoaderData<{ chatbot: { slug: string } }>();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://yourdomain.com";
  const codeToCopy = `${baseUrl}/chat/${chatbot.slug}`;

  const instructions = [
    { step: "1", description: "Copia el enlace" },
    {
      step: "2",
      description: "Compártelo con tus usuarios o úsalo para pruebas",
    },
    {
      step: "3",
      description: "Los usuarios podrán chatear directamente desde este enlace",
    },
  ];

  return (
    <CodeBlock
      title="Enlace directo al chatbot"
      language="url"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};

const Iframe = () => {
  const { chatbot } = useLoaderData<{ chatbot: { slug: string } }>();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://yourdomain.com";
  const codeToCopy = `<iframe 
  src="${baseUrl}/chat/${chatbot.slug}" 
  width="400" 
  height="600"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>`;

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

const SDK = () => {
  const { chatbot } = useLoaderData<{ chatbot: Chatbot }>();
  const { apiKey, loading, error, refetch } = useApiKey();

  // Generate the correct script URL with the user's API key
  const getScriptUrl = () => {
    if (!apiKey) return "";
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://yourdomain.com";
    return `${baseUrl}/api/sdk/${apiKey.key}.js`;
  };

  const codeToCopy = apiKey
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
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error al cargar la API key: {error}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">No se pudo generar la API key</p>
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
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          Información de tu API Key
        </h4>
        <div className="space-y-1 text-sm text-blue-700">
          <p>
            <strong>Nombre:</strong> {apiKey.name}
          </p>
          <p>
            <strong>Tipo:</strong> {apiKey.keyType}
          </p>
          <p>
            <strong>Límite por hora:</strong>{" "}
            {apiKey.rateLimit.toLocaleString()} requests
          </p>
          <p>
            <strong>Requests este mes:</strong>{" "}
            {apiKey.monthlyRequests.toLocaleString()}
          </p>
          <p>
            <strong>Total requests:</strong>{" "}
            {apiKey.requestCount.toLocaleString()}
          </p>
          <p>
            <strong>Estado:</strong>
            <span
              className={`ml-1 px-2 py-1 rounded text-xs ${
                apiKey.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {apiKey.isActive ? "Activa" : "Inactiva"}
            </span>
          </p>
          {apiKey.lastUsedAt && (
            <p>
              <strong>Último uso:</strong>{" "}
              {new Date(apiKey.lastUsedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Options */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">
          Opciones de configuración
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <strong>data-chatbot:</strong> Especifica qué chatbot usar
            <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
              data-chatbot="{chatbot.slug}"
            </code>
          </div>
          <div>
            <strong>data-theme:</strong> Tema del widget
            <div className="ml-4 mt-1">
              <code className="px-2 py-1 bg-gray-200 rounded text-xs mr-2">
                data-theme="light"
              </code>
              <code className="px-2 py-1 bg-gray-200 rounded text-xs">
                data-theme="dark"
              </code>
            </div>
          </div>
          <div>
            <strong>data-position:</strong> Posición del widget
            <div className="ml-4 mt-1 space-x-2">
              <code className="px-2 py-1 bg-gray-200 rounded text-xs">
                data-position="bottom-right"
              </code>
              <code className="px-2 py-1 bg-gray-200 rounded text-xs">
                data-position="bottom-left"
              </code>
            </div>
            <div className="ml-4 mt-1 space-x-2">
              <code className="px-2 py-1 bg-gray-200 rounded text-xs">
                data-position="top-right"
              </code>
              <code className="px-2 py-1 bg-gray-200 rounded text-xs">
                data-position="top-left"
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">
          Ejemplo de uso completo
        </h4>
        <pre className="text-sm text-green-700 bg-green-100 p-3 rounded overflow-x-auto">
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
