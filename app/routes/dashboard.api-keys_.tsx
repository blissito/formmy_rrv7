import { useState } from "react";
import type { Route } from "./+types/dashboard.api-keys_";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { Form, useActionData, useLoaderData, useFetcher, useSearchParams } from "react-router";
import { getAvailableCredits } from "server/llamaparse/credits.service";
import { APIDocumentation } from "~/components/APIDocumentation";
import { ObservabilityPanel } from "~/components/ObservabilityPanel";
import { listTraces, getTraceStats } from "server/tracing/trace.service.server";
import { nanoid } from "nanoid";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Obtener API keys del usuario
  // Si hay API keys huérfanas (chatbot eliminado), eliminarlas automáticamente
  let apiKeys;
  try {
    apiKeys = await db.apiKey.findMany({
      where: { userId: user.id },
      include: {
        chatbot: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error: any) {
    // Si falla por API keys huérfanas, limpiarlas
    if (error.message?.includes('Field chatbot is required to return data, got `null` instead')) {

      // Obtener todas las API keys sin include
      const allKeys = await db.apiKey.findMany({
        where: { userId: user.id },
        select: { id: true, chatbotId: true },
      });

      // Buscar cuáles tienen chatbots que no existen
      const keysToDelete = [];
      for (const key of allKeys) {
        const chatbot = await db.chatbot.findUnique({
          where: { id: key.chatbotId },
        });
        if (!chatbot) {
          keysToDelete.push(key.id);
        }
      }

      // Eliminar API keys huérfanas
      if (keysToDelete.length > 0) {
        await db.apiKey.deleteMany({
          where: { id: { in: keysToDelete } },
        });
      }

      // Reintentar la query
      apiKeys = await db.apiKey.findMany({
        where: { userId: user.id },
        include: {
          chatbot: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      throw error;
    }
  }

  // Obtener chatbots del usuario
  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });


  // Obtener créditos disponibles
  const credits = await getAvailableCredits(user.id);

  // Obtener traces recientes para observability
  const { traces, total } = await listTraces({
    userId: user.id,
    limit: 50,
  });

  // Obtener estadísticas de traces
  const traceStats = await getTraceStats({
    userId: user.id,
    periodDays: 7,
  });

  return { user, apiKeys, chatbots, credits, traces, traceStats };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const keyScope = (formData.get("keyScope") as string) || "SECRET";
    const allowedDomainsRaw = formData.get("allowedDomains") as string;

    if (!name) {
      return { success: false, error: "Nombre requerido" };
    }

    // Parse allowed domains (only for PUBLISHABLE keys)
    const allowedDomains = keyScope === "PUBLISHABLE" && allowedDomainsRaw
      ? allowedDomainsRaw.split(",").map(d => d.trim()).filter(Boolean)
      : [];

    // Validate domains for PUBLISHABLE keys
    if (keyScope === "PUBLISHABLE" && allowedDomains.length === 0) {
      return { success: false, error: "Las keys PUBLISHABLE requieren al menos un dominio permitido" };
    }

    // Generate key with appropriate prefix (formmy_sk_live_ or formmy_pk_live_)
    const prefix = keyScope === "PUBLISHABLE" ? "formmy_pk_live_" : "formmy_sk_live_";
    const key = `${prefix}${nanoid(32)}`;

    const apiKey = await db.apiKey.create({
      data: {
        key,
        name,
        userId: user.id,
        chatbotId: null, // SDK keys are not tied to a specific chatbot
        keyType: "LIVE",
        keyScope: keyScope as "SECRET" | "PUBLISHABLE",
        isActive: true,
        rateLimit: 1000,
        allowedDomains,
      },
    });

    return {
      success: true,
      apiKey: {
        ...apiKey,
        justCreated: true,
      },
    };
  }

  if (intent === "revoke") {
    const keyId = formData.get("keyId") as string;

    await db.apiKey.deleteMany({
      where: { id: keyId, userId: user.id },
    });

    return { success: true, message: "API key eliminada" };
  }

  return { success: false, error: "Intent no reconocido" };
};

// ═══════════════════════════════════════════════════════════════════════════
// Create Key Form Component
// ═══════════════════════════════════════════════════════════════════════════

function CreateKeyForm({
  onCancel,
  actionError,
}: {
  onCancel: () => void;
  actionError: string | null;
}) {
  const [keyScope, setKeyScope] = useState<"SECRET" | "PUBLISHABLE">("SECRET");

  return (
    <div className="border border-brand-200 bg-brand-50 rounded-lg p-3 mb-3">
      <Form method="post" className="space-y-3">
        <input type="hidden" name="intent" value="create" />
        <input type="hidden" name="keyScope" value={keyScope} />

        {/* Error message */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            {actionError}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-dark mb-1">Nombre descriptivo</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Ej: Producción API"
            className="w-full px-3 py-1.5 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Key Type Selector */}
        <div>
          <label className="block text-xs font-medium text-dark mb-2">Tipo de Key</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKeyScope("SECRET")}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                keyScope === "SECRET"
                  ? "border-brand-500 bg-white shadow-sm"
                  : "border-outlines hover:border-brand-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🔐</span>
                <span className="font-semibold text-sm text-dark">Secret</span>
              </div>
              <p className="text-xs text-metal">Para backend/servidor</p>
              <code className="text-xs text-brand-600 font-mono mt-1 block">formmy_sk_live_</code>
            </button>
            <button
              type="button"
              onClick={() => setKeyScope("PUBLISHABLE")}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                keyScope === "PUBLISHABLE"
                  ? "border-brand-500 bg-white shadow-sm"
                  : "border-outlines hover:border-brand-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🌐</span>
                <span className="font-semibold text-sm text-dark">Publishable</span>
              </div>
              <p className="text-xs text-metal">Para frontend/cliente</p>
              <code className="text-xs text-brand-600 font-mono mt-1 block">formmy_pk_live_</code>
            </button>
          </div>
        </div>

        {/* Allowed Domains (only for PUBLISHABLE) */}
        {keyScope === "PUBLISHABLE" && (
          <div>
            <label className="block text-xs font-medium text-dark mb-1">
              Dominios permitidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="allowedDomains"
              required
              placeholder="ejemplo.com, *.midominio.com, localhost:3000"
              className="w-full px-3 py-1.5 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-metal mt-1">
              Separa múltiples dominios con comas. Usa <code className="bg-gray-100 px-1 rounded">*</code> para wildcards.
            </p>
          </div>
        )}

        {/* Info box */}
        <div className={`rounded-lg px-3 py-2 text-xs ${
          keyScope === "SECRET"
            ? "bg-amber-50 border border-amber-200 text-amber-800"
            : "bg-blue-50 border border-blue-200 text-blue-800"
        }`}>
          {keyScope === "SECRET" ? (
            <>
              <strong>⚠️ Secret Key:</strong> Nunca expongas esta key en código frontend.
              Úsala solo en servidores backend.
            </>
          ) : (
            <>
              <strong>ℹ️ Publishable Key:</strong> Segura para usar en navegadores.
              Solo funcionará desde los dominios que configures.
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Crear API Key
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-outlines text-metal rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </Form>
    </div>
  );
}

export default function DashboardAPIKeys() {
  const { user, apiKeys, chatbots, credits, traces, traceStats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedChatbotId, setCopiedChatbotId] = useState<string | null>(null);
  const buyCredits = useFetcher();

  const activeTab = searchParams.get("tab") || "keys";

  const justCreatedKey = actionData?.success && (actionData as any).apiKey?.justCreated
    ? (actionData as any).apiKey
    : null;


  const handleBuyCredits = (packageSize: string) => {
    const formData = new FormData();
    formData.append("intent", `credits_${packageSize}`);
    buyCredits.submit(formData, { method: "post", action: "/api/stripe" });
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const downloadSDK = async () => {
    try {
      const response = await fetch('/sdk/formmy-parser.ts');
      const content = await response.text();
      const blob = new Blob([content], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formmy-parser.ts';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading SDK:', err);
    }
  };

  return (
    <section className="max-w-7xl mx-auto p-4 !min-h-0 h-auto">
      {/* Header + Credits Balance */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-outlines">
        <div>
          <h1 className="text-2xl font-bold text-space-800 dark:text-white mb-2">
            SDK para Desarrolladores
          </h1>
          <p className="text-sm text-metal mb-2 max-w-2xl">
            Integra Formmy AI en tu aplicación con nuestro SDK oficial. Usa <strong>@formmy.app/chat</strong> para agregar chatbots conversacionales a tu sitio web o app React.
          </p>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">💬 Chat Widget</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">⚛️ React SDK</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">🔐 API Keys (pk/sk)</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">📡 Streaming</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-baseline gap-1.5">
              <span className="text-metal">Comprados:</span>
              <span className="font-bold text-brand-600">{credits.purchasedCredits.toLocaleString()}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-metal">Mensuales:</span>
              <span className="font-bold text-brand-600">{credits.monthlyAvailable.toLocaleString()}</span>
              <span className="text-metal">/ {credits.planLimit.toLocaleString()}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-metal">Usados:</span>
              <span className="font-bold text-orange-600">{credits.lifetimeUsed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Paquetes de créditos */}
        <div className="flex flex-col lg:items-end gap-2">
          <span className="text-xs text-metal font-medium">Agregar más créditos</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBuyCredits("500")}
              disabled={buyCredits.state === "submitting"}
              className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-1.5 hover:border-brand-400 hover:shadow-md transition-all disabled:opacity-50"
            >
              <p className="text-xs font-bold text-brand-600">500 cr</p>
              <p className="text-xs text-metal">$99</p>
            </button>
            <button
              onClick={() => handleBuyCredits("2000")}
              disabled={buyCredits.state === "submitting"}
              className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-1.5 hover:border-brand-400 hover:shadow-md transition-all disabled:opacity-50"
            >
              <p className="text-xs font-bold text-brand-600">2K cr</p>
              <p className="text-xs text-metal">$349</p>
            </button>
            <button
              onClick={() => handleBuyCredits("5000")}
              disabled={buyCredits.state === "submitting"}
              className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-1.5 hover:border-brand-400 hover:shadow-md transition-all disabled:opacity-50"
            >
              <p className="text-xs font-bold text-brand-600">5K cr</p>
              <p className="text-xs text-metal">$799</p>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-4 border-b border-outlines">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("keys")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "keys"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-metal hover:text-dark"
            }`}
          >
            📦 SDK Keys
          </button>
          <button
            onClick={() => setTab("observability")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "observability"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-metal hover:text-dark"
            }`}
          >
            📊 Observability
          </button>
        </div>
        {activeTab === "keys" && (
          <button
            onClick={() => {
              const docSection = document.querySelector('[data-docs-section]');
              if (docSection) {
                docSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 px-3 py-1 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
          >
            📖 Ver Documentación
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "keys" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* API Keys List */}
        <div className="border border-outlines rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-dark text-base font-semibold">Tus API Keys</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              {showCreateForm ? "Cancelar" : "+ Nueva Key"}
            </button>
          </div>

          {/* Create Form - Integrado */}
          {showCreateForm && (
            <CreateKeyForm
              onCancel={() => setShowCreateForm(false)}
              actionError={actionData?.success === false ? (actionData as any).error : null}
            />
          )}

          {/* Just Created Key Alert - Integrado */}
          {justCreatedKey && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-800 font-semibold text-sm">✅ API Key creada</span>
              </div>
              <p className="text-xs text-green-700 mb-2">
                Guarda esta clave. No podrás verla nuevamente.
              </p>
              <div className="bg-white p-2 rounded-lg border border-green-200 relative">
                <code className="font-mono text-xs break-all text-dark pr-24">
                  {justCreatedKey.key}
                </code>
                <button
                  onClick={() => copyToClipboard(justCreatedKey.key)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md transition-all text-xs font-medium flex items-center gap-1.5 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {apiKeys.length === 0 && !showCreateForm ? (
            <div className="text-center py-8">
              <p className="text-metal text-sm mb-2">No tienes API keys creadas</p>
              <p className="text-xs text-metal">Crea una para comenzar a usar el Parser API</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => {
                const isPublishable = key.keyScope === "PUBLISHABLE" || key.key.includes("pk_live");
                const keyPrefix = key.key.includes("formmy_")
                  ? (isPublishable ? "formmy_pk_live_" : "formmy_sk_live_")
                  : (isPublishable ? "pk_live_" : "sk_live_");

                return (
                  <div
                    key={key.id}
                    className="border border-outlines rounded-lg p-3 hover:border-brand-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-dark text-sm truncate">{key.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isPublishable
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {isPublishable ? "🌐 Publishable" : "🔐 Secret"}
                          </span>
                        </div>
                        <div className="text-xs text-metal space-y-1">
                          {/* Show chatbot if linked */}
                          {key.chatbot && (
                            <p className="truncate">
                              Chatbot: <span className="text-dark font-medium">{key.chatbot.name}</span>
                            </p>
                          )}
                          {!key.chatbot && !key.chatbotId && (
                            <p className="text-green-600 font-medium">✓ Acceso a todos tus chatbots</p>
                          )}
                          <p className="font-mono text-xs">
                            Key: {keyPrefix}•••{key.key.slice(-8)}
                          </p>
                          {/* Show allowed domains for publishable keys */}
                          {isPublishable && key.allowedDomains && key.allowedDomains.length > 0 && (
                            <p className="flex items-center gap-1 flex-wrap">
                              <span className="text-metal">Dominios:</span>
                              {key.allowedDomains.map((domain, i) => (
                                <code key={i} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                                  {domain}
                                </code>
                              ))}
                            </p>
                          )}
                          <p>Requests: <span className="text-dark font-medium">{key.requestCount.toLocaleString()}</span></p>
                          {key.lastUsedAt && (
                            <p>Último uso: {new Date(key.lastUsedAt).toLocaleDateString("es-MX")}</p>
                          )}
                        </div>
                      </div>
                      <Form method="post">
                        <input type="hidden" name="intent" value="revoke" />
                        <input type="hidden" name="keyId" value={key.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                          onClick={(e) => {
                            if (!confirm("¿Estás seguro de eliminar esta API key? Esta acción no se puede deshacer.")) e.preventDefault();
                          }}
                        >
                          Eliminar
                        </button>
                      </Form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Documentation */}
        <APIDocumentation onDownloadSDK={downloadSDK} />
        </div>
      )}

      {/* Observability Tab */}
      {activeTab === "observability" && (
        <ObservabilityPanel chatbots={chatbots} traces={traces} traceStats={traceStats} />
      )}
    </section>
  );
}
