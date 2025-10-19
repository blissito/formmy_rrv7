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
  });

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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const justCreatedKey = actionData?.success && (actionData as any).apiKey?.justCreated
    ? (actionData as any).apiKey
    : null;

  return (
    <section className="max-w-7xl mx-auto py-6 md:py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl text-space-800 dark:text-white font-semibold">
            API Keys del Parser
          </h2>
          <p className="text-metal mt-1">
            Gestiona tus claves de API para acceder al Parser Avanzado vía REST API
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
        >
          + Nueva API Key
        </button>
      </div>

      {/* Credits Balance Card */}
      <div className="border border-outlines rounded-3xl py-6 md:py-8 px-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <h3 className="text-dark text-xl heading mb-4">Balance de Créditos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-metal">Créditos Comprados</p>
            <p className="text-2xl font-bold text-brand-600">{credits.purchasedCredits.toLocaleString()}</p>
            <p className="text-xs text-metal">No caducan</p>
          </div>
          <div>
            <p className="text-sm text-metal">Créditos Mensuales</p>
            <p className="text-2xl font-bold text-brand-600">{credits.monthlyAvailable.toLocaleString()}</p>
            <p className="text-xs text-metal">de {credits.planLimit.toLocaleString()} (plan {user.plan})</p>
          </div>
          <div>
            <p className="text-sm text-metal">Total Disponible</p>
            <p className="text-2xl font-bold text-green-600">{credits.totalAvailable.toLocaleString()}</p>
            <p className="text-xs text-metal">Lifetime usado: {credits.lifetimeUsed.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="border border-outlines rounded-3xl py-6 md:py-8 px-6 mb-6">
          <h3 className="text-dark text-xl heading mb-4">Crear Nueva API Key</h3>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create" />
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Nombre descriptivo
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej: Producción, Testing, Demo"
                className="w-full px-4 py-2 border border-outlines rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Chatbot asociado
              </label>
              <select
                name="chatbotId"
                required
                className="w-full px-4 py-2 border border-outlines rounded-xl focus:outline-none focus:border-brand-500"
              >
                <option value="">Selecciona un chatbot</option>
                {chatbots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
              >
                Crear API Key
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-outlines text-dark rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* Just Created Key Alert */}
      {justCreatedKey && (
        <div className="border border-green-200 bg-green-50 rounded-3xl py-6 md:py-8 px-6 mb-6">
          <h3 className="text-green-800 text-xl heading mb-2">✅ API Key Creada</h3>
          <p className="text-green-700 mb-4">
            Guarda esta clave ahora. No podrás verla nuevamente.
          </p>
          <div className="bg-white p-4 rounded-xl border border-green-200 font-mono text-sm break-all">
            {justCreatedKey.key}
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="border border-outlines rounded-3xl py-6 md:py-8 px-6 mb-6">
        <h3 className="text-dark text-xl heading mb-4">Tus API Keys</h3>
        {apiKeys.length === 0 ? (
          <p className="text-metal text-center py-8">
            No tienes API keys creadas. Crea una para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="border border-outlines rounded-xl p-4 hover:border-brand-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-dark">{key.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        key.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {key.isActive ? "Activa" : "Revocada"}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-metal">
                      <p>Chatbot: {key.chatbot?.name}</p>
                      <p>Key: sk_live_•••••••{key.key.slice(-8)}</p>
                      <p>Creada: {new Date(key.createdAt).toLocaleDateString("es-MX")}</p>
                      <p>Requests: {key.requestCount.toLocaleString()}</p>
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
                        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          if (!confirm("¿Seguro que quieres revocar esta API key?")) {
                            e.preventDefault();
                          }
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
      <div className="border border-outlines rounded-3xl py-6 md:py-8 px-6">
        <h3 className="text-dark text-xl heading mb-4">Documentación de la API</h3>

        {/* Quick Start */}
        <div className="mb-6">
          <h4 className="font-semibold text-dark mb-2">Quick Start</h4>
          <p className="text-metal text-sm mb-3">
            Endpoint: <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://formmy-v2.fly.dev/api/parser/v1</code>
          </p>
        </div>

        {/* Code Examples */}
        <div className="space-y-4">
          <details className="border border-outlines rounded-xl p-4">
            <summary className="cursor-pointer font-semibold text-dark">cURL</summary>
            <pre className="mt-3 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`# Upload document
curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "mode=AGENTIC"

# Check status
curl https://formmy-v2.fly.dev/api/parser/v1?intent=status&jobId=JOB_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          </details>

          <details className="border border-outlines rounded-xl p-4">
            <summary className="cursor-pointer font-semibold text-dark">TypeScript</summary>
            <pre className="mt-3 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`import { FormmyParser } from './sdk/formmy-parser';

const parser = new FormmyParser('YOUR_API_KEY');

// Parse document
const job = await parser.parse('./document.pdf', 'AGENTIC');
console.log('Job ID:', job.id);

// Wait for completion
const result = await parser.waitFor(job.id);
console.log('Markdown:', result.markdown);`}</pre>
          </details>

          <details className="border border-outlines rounded-xl p-4">
            <summary className="cursor-pointer font-semibold text-dark">Python</summary>
            <pre className="mt-3 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`import requests
import time

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://formmy-v2.fly.dev/api/parser/v1"

# Upload document
with open("document.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}?intent=upload",
        headers={"Authorization": f"Bearer {API_KEY}"},
        files={"file": f},
        data={"mode": "AGENTIC"}
    )
    job = response.json()

# Poll for status
while True:
    status = requests.get(
        f"{BASE_URL}?intent=status&jobId={job['id']}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    ).json()

    if status['job']['status'] == 'COMPLETED':
        print(status['job']['resultMarkdown'])
        break
    time.sleep(2)`}</pre>
          </details>
        </div>

        {/* Parsing Modes */}
        <div className="mt-6">
          <h4 className="font-semibold text-dark mb-3">Modos de Parsing</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-outlines rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="font-semibold text-sm">COST_EFFECTIVE</span>
              </div>
              <p className="text-xs text-metal">1 crédito • Rápido y económico</p>
            </div>
            <div className="border border-outlines rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎯</span>
                <span className="font-semibold text-sm">AGENTIC</span>
              </div>
              <p className="text-xs text-metal">3 créditos • Balance óptimo</p>
            </div>
            <div className="border border-outlines rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✨</span>
                <span className="font-semibold text-sm">AGENTIC_PLUS</span>
              </div>
              <p className="text-xs text-metal">6 créditos • Máxima fidelidad + OCR</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
