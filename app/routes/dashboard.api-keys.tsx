import { useState } from "react";
import type { Route } from "./+types/dashboard.api-keys";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { Form, useActionData } from "react-router";
import { nanoid } from "nanoid";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  // Obtener API keys del usuario
  const apiKeys = await db.apiKey.findMany({
    where: { userId: user.id },
    include: {
      chatbot: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return { user, apiKeys };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const chatbotId = formData.get("chatbotId") as string;

    if (!name || !chatbotId) {
      return { error: "Name and chatbot are required" };
    }

    // Verificar que el chatbot pertenece al usuario
    const chatbot = await db.chatbot.findFirst({
      where: { id: chatbotId, userId: user.id },
    });

    if (!chatbot) {
      return { error: "Chatbot not found" };
    }

    // Generar API key
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

    return { success: true, apiKey: { ...apiKey, justCreated: true } };
  }

  if (intent === "revoke") {
    const keyId = formData.get("keyId") as string;

    if (!keyId) {
      return { error: "Key ID required" };
    }

    // Verificar ownership
    const apiKey = await db.apiKey.findFirst({
      where: { id: keyId, userId: user.id },
    });

    if (!apiKey) {
      return { error: "API key not found" };
    }

    // Desactivar
    await db.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return { success: true, revoked: true };
  }

  return { error: "Invalid intent" };
};

export default function ApiKeys({ loaderData, actionData }: Route.ComponentProps) {
  const { user, apiKeys } = loaderData;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Obtener chatbots del usuario para el select
  const [chatbots, setChatbots] = useState<any[]>([]);

  // Cargar chatbots
  useState(() => {
    fetch("/api/v1/chatbot?intent=list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setChatbots(data.chatbots);
        }
      })
      .catch(console.error);
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🔑 API Keys</h1>
        <p className="text-gray-600">
          Gestiona tus claves de API para acceder al Parser Avanzado y otras funciones de Formmy vía REST API.
        </p>
      </div>

      {/* Lista de API Keys */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Tus API Keys</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Crear Nueva Key
          </button>
        </div>

        {/* Formulario crear key */}
        {showCreateForm && (
          <Form method="post" className="mb-6 p-4 bg-gray-50 rounded-lg">
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  name="name"
                  placeholder="ej: YouTube Demos"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chatbot</label>
                <select name="chatbotId" className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Seleccionar chatbot...</option>
                  {chatbots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Crear Key
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </Form>
        )}

        {actionData?.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {actionData.error}
          </div>
        )}

        {actionData?.success && actionData?.apiKey?.justCreated && (
          <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 rounded">
            <p className="font-semibold text-green-800 mb-2">✅ API Key creada exitosamente</p>
            <div className="bg-white p-3 rounded border flex justify-between items-center">
              <code className="text-sm font-mono">{actionData.apiKey.key}</code>
              <button
                onClick={() => copyToClipboard(actionData.apiKey.key)}
                className="ml-4 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                {copiedKey === actionData.apiKey.key ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ⚠️ Guarda esta key en un lugar seguro. No podrás verla de nuevo.
            </p>
          </div>
        )}

        {/* Tabla de keys */}
        {apiKeys.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tienes API keys todavía. Crea una para empezar.
          </p>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{apiKey.name}</h3>
                  <p className="text-sm text-gray-600">
                    Chatbot: {apiKey.chatbot.name}
                  </p>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    {apiKey.key.substring(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Requests este mes: {apiKey.monthlyRequests} / {apiKey.rateLimit}
                  </p>
                </div>
                <Form method="post">
                  <input type="hidden" name="intent" value="revoke" />
                  <input type="hidden" name="keyId" value={apiKey.id} />
                  <button
                    type="submit"
                    className="text-red-600 hover:text-red-800 font-medium"
                    onClick={(e) => {
                      if (!confirm("¿Seguro que quieres revocar esta key?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    🗑️ Revocar
                  </button>
                </Form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documentación */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">📖 Parser API v1 - Documentación</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Usa tu API key para parsear documentos con LlamaParse avanzado:
            </p>
            <div className="tabs">
              <details open className="mb-4">
                <summary className="cursor-pointer font-semibold bg-gray-200 p-2 rounded">
                  cURL
                </summary>
                <pre className="bg-gray-900 text-green-400 p-4 rounded mt-2 overflow-x-auto text-sm">
{`curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -F "file=@document.pdf" \\
  -F "mode=AGENTIC"

# Check status
curl https://formmy-v2.fly.dev/api/parser/v1?intent=status&jobId=xxx \\
  -H "Authorization: Bearer sk_live_xxxxx"`}
                </pre>
              </details>

              <details className="mb-4">
                <summary className="cursor-pointer font-semibold bg-gray-200 p-2 rounded">
                  TypeScript/Node.js
                </summary>
                <pre className="bg-gray-900 text-green-400 p-4 rounded mt-2 overflow-x-auto text-sm">
{`import { FormmyParser } from './sdk/formmy-parser';

const parser = new FormmyParser('sk_live_xxxxx');

// Parse
const job = await parser.parse('./documento.pdf', 'AGENTIC');
console.log(\`Job \${job.id} creado. Créditos: \${job.creditsUsed}\`);

// Wait for completion
const result = await parser.waitFor(job.id);
console.log(result.markdown);`}
                </pre>
              </details>

              <details className="mb-4">
                <summary className="cursor-pointer font-semibold bg-gray-200 p-2 rounded">
                  Python
                </summary>
                <pre className="bg-gray-900 text-green-400 p-4 rounded mt-2 overflow-x-auto text-sm">
{`import requests
import time

headers = {'Authorization': 'Bearer sk_live_xxxxx'}

# Upload
files = {'file': open('documento.pdf', 'rb')}
data = {'mode': 'AGENTIC'}
r = requests.post(
    'https://formmy-v2.fly.dev/api/parser/v1?intent=upload',
    headers=headers,
    files=files,
    data=data
)
job = r.json()
print(f"Job {job['id']} - Créditos: {job['creditsUsed']}")

# Poll status
while True:
    r = requests.get(
        f"https://formmy-v2.fly.dev/api/parser/v1?intent=status&jobId={job['id']}",
        headers=headers
    )
    status = r.json()
    if status['status'] == 'COMPLETED':
        print(status['markdown'])
        break
    time.sleep(2)`}
                </pre>
              </details>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">📊 Pricing (Créditos)</h3>
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Modo</th>
                <th className="border px-4 py-2 text-left">Créditos</th>
                <th className="border px-4 py-2 text-left">Características</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-mono">COST_EFFECTIVE</td>
                <td className="border px-4 py-2">1</td>
                <td className="border px-4 py-2">Parsing básico, rápido</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-mono">AGENTIC</td>
                <td className="border px-4 py-2">3</td>
                <td className="border px-4 py-2">Tablas estructuradas, mejor calidad</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-mono">AGENTIC_PLUS</td>
                <td className="border px-4 py-2">6</td>
                <td className="border px-4 py-2">OCR avanzado, imágenes, máxima precisión</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm">
            <strong>💡 Límites por Plan:</strong>
          </p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• STARTER: 200 créditos/mes</li>
            <li>• PRO: 1,000 créditos/mes</li>
            <li>• ENTERPRISE: 5,000 créditos/mes</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
