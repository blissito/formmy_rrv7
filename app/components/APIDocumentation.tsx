import { useState, useEffect } from "react";
import { CodeSnippet } from "./CodeSnippet";

interface APIDocumentationProps {
  onDownloadSDK?: () => void; // Deprecated - kept for backwards compatibility
}

const STORAGE_KEY = "formmy_api_docs_tab";

export function APIDocumentation({ onDownloadSDK }: APIDocumentationProps) {
  // Inicializar desde localStorage o default "sdk"
  const [docTab, setDocTab] = useState<"parser" | "rag" | "sdk">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved as "parser" | "rag" | "sdk") || "sdk";
    }
    return "sdk";
  });

  // Guardar en localStorage cuando cambie el tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, docTab);
    }
  }, [docTab]);

  const sdkBackendCode = `import { Formmy } from '@formmy.app/chat';

const formmy = new Formmy({ secretKey: 'formmy_sk_live_xxx' });

// List all agents
const { agents } = await formmy.agents.list();

// Create a new agent
const { agent } = await formmy.agents.create({
  name: 'Customer Support',
  instructions: 'You are a helpful customer support agent.',
  welcomeMessage: 'Hello! How can I help you today?',
});

// Send a message (non-streaming)
const response = await formmy.chat.send({
  agentId: agent.id,
  message: 'Hello!',
});`;

  const sdkFrontendCode = `import { FormmyProvider, ChatBubble } from '@formmy.app/chat/react';

function App() {
  return (
    <FormmyProvider publishableKey="formmy_pk_live_xxx">
      <YourApp />
      <ChatBubble
        agentId="agent_xxx"
        position="bottom-right"
        theme="light"
      />
    </FormmyProvider>
  );
}`;

  const curlParserCode = `# Parsing GRATUITO (default)
curl -X POST https://formmy.app/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "mode=DEFAULT"

# Parsing avanzado (costo por página)
curl -X POST https://formmy.app/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "mode=AGENTIC"

# Response:
# {
#   "id": "job_abc123",
#   "status": "PENDING",
#   "fileName": "document.pdf",
#   "mode": "DEFAULT",
#   "creditsUsed": 0,
#   "createdAt": "2025-01-18T10:00:00Z"
# }`;

  const curlStatusCode = `curl https://formmy.app/api/parser/v1?intent=status&jobId=job_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response (COMPLETED):
# {
#   "id": "job_abc123",
#   "status": "COMPLETED",
#   "markdown": "# Document content...",
#   "pages": 15,
#   "processingTime": 45.2,
#   "creditsUsed": 3
# }`;

  const curlRAGListCode = `# Listar contextos del chatbot
curl https://formmy.app/api/v1/rag?intent=list \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
# {
#   "chatbotId": "abc123",
#   "chatbotName": "Mi Chatbot",
#   "totalContexts": 15,
#   "totalSizeKB": 2048,
#   "totalEmbeddings": 456,
#   "contexts": [
#     {
#       "id": "ctx_abc123",
#       "type": "FILE",
#       "fileName": "manual.pdf",
#       "sizeKB": 512,
#       "createdAt": "2025-01-18T10:00:00Z",
#       "parsingMode": "AGENTIC",
#       "parsingPages": 15,
#       "parsingCredits": 45
#     }
#   ]
# }`;

  const curlRAGUploadCode = `# Subir contexto manualmente
curl -X POST https://formmy.app/api/v1/rag?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Horarios: Lunes a Viernes 9:00-18:00",
    "type": "TEXT",
    "metadata": {
      "title": "Horarios de Atención"
    }
  }'

# Response:
# {
#   "success": true,
#   "contextId": "ctx_xyz789",
#   "embeddingsCreated": 3,
#   "embeddingsSkipped": 0,
#   "creditsUsed": 3
# }`;

  const curlRAGQueryCode = `# Consultar RAG con búsqueda semántica
curl -X POST https://formmy.app/api/v1/rag?intent=query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "¿Cuáles son los horarios de atención?",
    "topK": 5
  }'

# Response:
# {
#   "query": "¿Cuáles son los horarios de atención?",
#   "answer": "[1] Horarios de Atención:\\nHorarios: Lunes a Viernes 9:00-18:00...",
#   "sources": [
#     {
#       "content": "Horarios: Lunes a Viernes 9:00 - 18:00",
#       "score": 0.92,
#       "metadata": {
#         "fileName": "info.pdf",
#         "title": "Horarios de Atención",
#         "contextType": "TEXT"
#       }
#     }
#   ],
#   "creditsUsed": 2
# }`;

  const pythonCode = `import requests
import time

# Upload documento GRATIS (DEFAULT mode)
response = requests.post(
    "https://formmy.app/api/parser/v1?intent=upload",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    files={"file": open("document.pdf", "rb")},
    data={"mode": "DEFAULT"}  # GRATIS - 0 créditos
)
job = response.json()
print(f"Job ID: {job['id']} - Créditos: {job['creditsUsed']}")

# Polling para esperar resultado
while True:
    status_response = requests.get(
        f"https://formmy.app/api/parser/v1?intent=status&jobId={job['id']}",
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    result = status_response.json()

    if result['status'] == 'COMPLETED':
        print(result['markdown'])
        break
    elif result['status'] == 'FAILED':
        print(f"Error: {result['error']}")
        break

    time.sleep(2)`;

  return (
    <div className="border border-outlines rounded-xl p-4" data-docs-section>
      <div className="mb-3">
        <h3 className="text-dark text-base font-semibold mb-1">📖 Documentación</h3>
        <p className="text-xs text-metal">
          SDK de Chat + APIs de Parser y RAG
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-outlines">
        <button
          onClick={() => setDocTab("sdk")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            docTab === "sdk"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-metal hover:text-dark"
          }`}
        >
          📦 Chat SDK
        </button>
        <button
          onClick={() => setDocTab("parser")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            docTab === "parser"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-metal hover:text-dark"
          }`}
        >
          📄 Parser API
        </button>
        <button
          onClick={() => setDocTab("rag")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            docTab === "rag"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-metal hover:text-dark"
          }`}
        >
          🔍 RAG API
        </button>
      </div>

      <div className="space-y-4">
        {/* Parser API Tab */}
        {docTab === "parser" && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-dark font-semibold mb-1">🚀 Parser Avanzado de Documentos</p>
              <p className="text-xs text-metal">
                Extrae texto, tablas y datos estructurados de PDF, Word, Excel y más. Soporta OCR para documentos escaneados e imágenes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Endpoints</h4>
              <div className="space-y-2">
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-green-700">POST /api/parser/v1?intent=upload</p>
                  <p className="text-xs text-metal mt-1">Parsear documento (PDF/DOCX/XLSX/TXT) con OCR opcional</p>
                </div>
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-blue-700">GET /api/parser/v1?intent=status&jobId=xxx</p>
                  <p className="text-xs text-metal mt-1">Consultar estado de job (polling hasta COMPLETED)</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo cURL - Upload</h4>
              <CodeSnippet code={curlParserCode} language="bash" title="cURL - Parse Document" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo cURL - Status</h4>
              <CodeSnippet code={curlStatusCode} language="bash" title="cURL - Check Status" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo Python</h4>
              <CodeSnippet code={pythonCode} language="python" title="Python - Parse & Wait" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Modos de Parsing</h4>
              <div className="space-y-2">
                <div className="border-2 border-green-400 bg-green-50 rounded-lg p-2 hover:border-green-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🆓</span>
                      <div>
                        <p className="font-semibold text-sm text-green-800">DEFAULT</p>
                        <p className="text-xs text-green-700">Parsing gratuito</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600">GRATIS</span>
                  </div>
                </div>
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
                        <p className="text-xs text-metal">Tablas complejas + mejor calidad</p>
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
                        <p className="text-xs text-metal">OCR + imágenes + máxima precisión</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-600">6 cr/pág</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* RAG API Tab */}
        {docTab === "rag" && (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-dark font-semibold mb-1">🔍 RAG API - Búsqueda Semántica</p>
              <p className="text-xs text-metal">
                Gestiona y consulta tu base de conocimiento con búsqueda vectorial. Lista contextos, sube contenido manualmente y realiza queries semánticas con fuentes citadas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Endpoints</h4>
              <div className="space-y-2">
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-blue-700">GET /api/v1/rag?intent=list</p>
                  <p className="text-xs text-metal mt-1">Listar contextos del chatbot con métricas</p>
                </div>
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-green-700">POST /api/v1/rag?intent=upload</p>
                  <p className="text-xs text-metal mt-1">Subir contexto manualmente (TEXT/FILE/LINK/QUESTION)</p>
                </div>
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-purple-700">POST /api/v1/rag?intent=query</p>
                  <p className="text-xs text-metal mt-1">Consultar RAG con búsqueda semántica</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo 1: Listar Contextos</h4>
              <CodeSnippet code={curlRAGListCode} language="bash" title="cURL - List Contexts" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo 2: Subir Contexto</h4>
              <CodeSnippet code={curlRAGUploadCode} language="bash" title="cURL - Upload Context" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo 3: Query RAG</h4>
              <CodeSnippet code={curlRAGQueryCode} language="bash" title="cURL - RAG Query" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Costos de Créditos</h4>
              <div className="space-y-2">
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">intent=list</p>
                      <p className="text-xs text-metal">Listar contextos y embeddings</p>
                    </div>
                    <span className="text-xs font-bold text-green-600">GRATIS</span>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">intent=query</p>
                      <p className="text-xs text-metal">Búsqueda vectorial + respuesta con fuentes</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">2 cr</span>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">intent=upload</p>
                      <p className="text-xs text-metal">Subir contexto + generar embeddings</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">3 cr</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Parámetros de Query</h4>
              <div className="space-y-2 text-xs">
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <code className="font-mono text-brand-600">topK</code>
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">OPCIONAL</span>
                  </div>
                  <p className="text-metal mb-2">Número de resultados (1-20). Default: <strong>5</strong></p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[11px]">
                    <p className="text-blue-800 font-medium mb-1">💡 Mejores Prácticas</p>
                    <ul className="space-y-0.5 text-blue-700">
                      <li>• <strong>topK=3-5</strong>: Queries simples (90% casos)</li>
                      <li>• <strong>topK=7-10</strong>: Queries complejas</li>
                      <li>• <strong>topK=15-20</strong>: Análisis exhaustivo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Códigos de Error</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <code className="bg-gray-100 px-1 text-dark font-bold">401</code>
                  <span className="text-metal"> - API key inválida o faltante</span>
                </li>
                <li>
                  <code className="bg-red-100 px-1 text-red-700 font-bold">402 Payment Required</code>
                  <span className="text-metal"> - Créditos insuficientes</span>
                  <div className="mt-1 ml-10 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-800">
                    <strong>⚠️ Validación pre-procesamiento:</strong> El sistema cuenta páginas ANTES de procesar.
                    Si no tienes suficientes créditos, recibes error 402 con desglose exacto de créditos disponibles vs requeridos.
                    NO se cobra ni procesa el documento.
                  </div>
                </li>
                <li>
                  <code className="bg-gray-100 px-1 text-dark font-bold">403</code>
                  <span className="text-metal"> - Chatbot no encontrado o sin permisos</span>
                </li>
                <li>
                  <code className="bg-gray-100 px-1 text-dark font-bold">500</code>
                  <span className="text-metal"> - Error interno del servidor</span>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* SDK Tab */}
        {docTab === "sdk" && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-dark text-sm mb-1">📦 @formmy.app/chat</h4>
                  <p className="text-xs text-metal mb-3">
                    SDK oficial de React para Formmy AI Chat. Agrega chatbots conversacionales a tu aplicación en minutos.
                  </p>
                  <ul className="text-xs text-metal space-y-1">
                    <li>✅ Instalación via npm</li>
                    <li>✅ Componentes React listos para usar</li>
                    <li>✅ Hook headless para UIs personalizadas</li>
                    <li>✅ Streaming en tiempo real</li>
                    <li>✅ TypeScript incluido</li>
                  </ul>
                </div>
                <a
                  href="/docs/sdk"
                  className="flex-shrink-0 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Ver Documentación
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Instalación</h4>
              <CodeSnippet code="npm install @formmy.app/chat" language="bash" title="Terminal" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Backend (Node.js)</h4>
              <p className="text-xs text-metal mb-2">
                Usa la <strong>Secret Key</strong> (<code className="bg-amber-100 text-amber-800 px-1 rounded">formmy_sk_live_</code>) para operaciones de servidor.
              </p>
              <CodeSnippet code={sdkBackendCode} language="typescript" title="Backend - Formmy Client" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Frontend (React)</h4>
              <p className="text-xs text-metal mb-2">
                Usa la <strong>Publishable Key</strong> (<code className="bg-blue-100 text-blue-800 px-1 rounded">formmy_pk_live_</code>) para el widget de chat.
              </p>
              <CodeSnippet code={sdkFrontendCode} language="typescript" title="Frontend - React Components" />
            </div>

            <div className="bg-gray-50 border border-outlines rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔗</span>
                <h4 className="font-semibold text-dark text-sm">Recursos</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.npmjs.com/package/@formmy.app/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z"/>
                  </svg>
                  npm
                </a>
                <a
                  href="https://github.com/blissito/formmy-sdk-demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Demo
                </a>
                <a
                  href="/docs/sdk"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-xs font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Docs Completos
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
