import { useState } from "react";
import type { Route } from "./+types/dashboard.api-keys_";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { Form, useActionData, useLoaderData, useFetcher } from "react-router";
import { nanoid } from "nanoid";
import { getAvailableCredits } from "server/llamaparse/credits.service";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Obtener API keys del usuario
  const apiKeys = await db.apiKey.findMany({
    where: { userId: user.id },
    include: {
      chatbot: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Obtener chatbots del usuario
  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`[API Keys] Usuario ${user.email} tiene ${chatbots.length} chatbots ACTIVE`);

  // Obtener créditos disponibles
  const credits = await getAvailableCredits(user.id);

  return { user, apiKeys, chatbots, credits };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const chatbotId = formData.get("chatbotId") as string;

    if (!name || !chatbotId) {
      return { success: false, error: "Nombre y chatbot requeridos" };
    }

    const chatbot = await db.chatbot.findFirst({
      where: { id: chatbotId, userId: user.id },
    });

    if (!chatbot) {
      return { success: false, error: "Chatbot no encontrado" };
    }

    const key = `sk_live_${nanoid(32)}`;

    const apiKey = await db.apiKey.create({
      data: {
        key,
        name,
        chatbotId,
        userId: user.id,
        keyType: "LIVE",
        isActive: true,
        rateLimit: 1000,
        allowedDomains: [],
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

    await db.apiKey.updateMany({
      where: { id: keyId, userId: user.id },
      data: { isActive: false },
    });

    return { success: true, message: "API key revocada" };
  }

  return { success: false, error: "Intent no reconocido" };
};

export default function DashboardAPIKeys() {
  const { user, apiKeys, chatbots, credits } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const buyCredits = useFetcher();

  const justCreatedKey = actionData?.success && (actionData as any).apiKey?.justCreated
    ? (actionData as any).apiKey
    : null;

  console.log('[Client] Chatbots cargados:', chatbots.length, chatbots);

  const handleBuyCredits = (packageSize: string) => {
    const formData = new FormData();
    formData.append("intent", `credits_${packageSize}`);
    buyCredits.submit(formData, { method: "post", action: "/api/stripe" });
  };

  return (
    <section className="max-w-7xl mx-auto p-4 !min-h-0 h-auto">
      {/* Header + Credits Balance */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-outlines">
        <div>
          <h1 className="text-2xl font-bold text-space-800 dark:text-white mb-2">
            Parser API
          </h1>
          <p className="text-sm text-metal mb-3 max-w-2xl">
            Crea API keys para usar nuestro parser avanzado de documentos. Extrae texto, tablas y datos estructurados de PDFs, Word y más.
          </p>
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
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-metal font-medium">Agregar más créditos</span>
          <div className="flex items-center gap-2">
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

      {/* Main Content - Grilla 2 columnas optimizada */}
      <div className="grid grid-cols-2 gap-4">
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
            <div className="border border-brand-200 bg-brand-50 rounded-lg p-3 mb-3">
              {chatbots.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-metal mb-2">No tienes chatbots activos</p>
                  <p className="text-xs text-metal mb-3">Necesitas crear un chatbot primero</p>
                  <a
                    href="/dashboard/chat/nuevo"
                    className="inline-block px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                  >
                    Crear Chatbot
                  </a>
                </div>
              ) : (
                <Form method="post" className="space-y-3">
                  <input type="hidden" name="intent" value="create" />
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
                  <div>
                    <label className="block text-xs font-medium text-dark mb-1">
                      Chatbot asociado ({chatbots.length} disponible{chatbots.length !== 1 ? 's' : ''})
                    </label>
                    <select
                      name="chatbotId"
                      required
                      className="w-full px-3 py-1.5 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500 bg-white"
                    >
                      <option value="">Seleccionar chatbot...</option>
                      {chatbots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                  >
                    Crear API Key
                  </button>
                </Form>
              )}
            </div>
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
              <div className="bg-white p-2 rounded-lg border border-green-200">
                <code className="font-mono text-xs break-all text-dark">
                  {justCreatedKey.key}
                </code>
              </div>
            </div>
          )}

          {apiKeys.length === 0 && !showCreateForm ? (
            <div className="text-center py-8">
              <p className="text-metal text-sm mb-2">No tienes API keys creadas</p>
              <p className="text-xs text-metal">Crea una para comenzar a usar el Parser API</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="border border-outlines rounded-lg p-3 hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-dark text-sm truncate">{key.name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                          key.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {key.isActive ? "Activa" : "Revocada"}
                        </span>
                      </div>
                      <div className="text-xs text-metal space-y-1">
                        <p className="truncate">Chatbot: <span className="text-dark font-medium">{key.chatbot?.name}</span></p>
                        <p className="font-mono text-xs">Key: sk_live_•••{key.key.slice(-8)}</p>
                        <p>Requests: <span className="text-dark font-medium">{key.requestCount.toLocaleString()}</span></p>
                        {key.lastUsedAt && (
                          <p>Último uso: {new Date(key.lastUsedAt).toLocaleDateString("es-MX")}</p>
                        )}
                      </div>
                    </div>
                    {key.isActive && (
                      <Form method="post">
                        <input type="hidden" name="intent" value="revoke" />
                        <input type="hidden" name="keyId" value={key.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                          onClick={(e) => {
                            if (!confirm("¿Estás seguro de revocar esta API key?")) e.preventDefault();
                          }}
                        >
                          Revocar
                        </button>
                      </Form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="border border-outlines rounded-xl p-4">
          <h3 className="text-dark text-base font-semibold mb-3">Documentación API</h3>

          <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
            {/* Endpoint */}
            <div>
              <p className="text-xs font-medium text-metal mb-1">Endpoint Base</p>
              <code className="block bg-gray-100 px-3 py-2 rounded-lg text-xs font-mono">
                https://formmy-v2.fly.dev/api/parser/v1
              </code>
            </div>

            {/* Code Examples */}
            <details className="border border-outlines rounded-lg">
              <summary className="cursor-pointer font-semibold text-dark text-sm px-3 py-2 hover:bg-gray-50">
                cURL
              </summary>
              <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded-b-lg text-xs overflow-x-auto">
{`curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "mode=AGENTIC"`}</pre>
            </details>

            <details className="border border-outlines rounded-lg">
              <summary className="cursor-pointer font-semibold text-dark text-sm px-3 py-2 hover:bg-gray-50">
                TypeScript SDK
              </summary>
              <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded-b-lg text-xs overflow-x-auto">
{`import { FormmyParser } from './sdk/formmy-parser';

const parser = new FormmyParser('YOUR_API_KEY');
const job = await parser.parse('./document.pdf', 'AGENTIC');
const result = await parser.waitFor(job.id);
console.log(result.markdown);`}</pre>
            </details>

            <details className="border border-outlines rounded-lg">
              <summary className="cursor-pointer font-semibold text-dark text-sm px-3 py-2 hover:bg-gray-50">
                Python
              </summary>
              <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded-b-lg text-xs overflow-x-auto">
{`import requests

response = requests.post(
    "https://formmy-v2.fly.dev/api/parser/v1?intent=upload",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    files={"file": open("document.pdf", "rb")},
    data={"mode": "AGENTIC"}
)
job = response.json()`}</pre>
            </details>

            {/* Parsing Modes */}
            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Modos de Parsing</h4>
              <div className="space-y-2">
                <div className="border border-outlines rounded-lg p-2 hover:border-brand-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <div>
                        <p className="font-semibold text-sm">COST_EFFECTIVE</p>
                        <p className="text-xs text-metal">Rápido y económico</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-600">1 cr/pág</span>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2 hover:border-brand-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <div>
                        <p className="font-semibold text-sm">AGENTIC</p>
                        <p className="text-xs text-metal">Balance óptimo</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-600">3 cr/pág</span>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2 hover:border-brand-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <div>
                        <p className="font-semibold text-sm">AGENTIC_PLUS</p>
                        <p className="text-xs text-metal">Máxima precisión + OCR</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-600">6 cr/pág</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
