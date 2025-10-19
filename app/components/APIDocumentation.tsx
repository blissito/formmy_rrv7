import { useState, useEffect } from "react";
import { CodeSnippet } from "./CodeSnippet";

interface APIDocumentationProps {
  onDownloadSDK: () => void;
}

const STORAGE_KEY = "formmy_api_docs_tab";

export function APIDocumentation({ onDownloadSDK }: APIDocumentationProps) {
  // Inicializar desde localStorage o default "parser"
  const [docTab, setDocTab] = useState<"parser" | "rag" | "sdk">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved as "parser" | "rag" | "sdk") || "parser";
    }
    return "parser";
  });

  // Guardar en localStorage cuando cambie el tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, docTab);
    }
  }, [docTab]);

  const sdkCode = `// Importar directamente desde CDN (ES Module)
import { FormmyParser } from 'https://formmy-v2.fly.dev/sdk/formmy-parser.js';

// Inicializar cliente
const parser = new FormmyParser('YOUR_API_KEY');

// 1. Parsear documento
const job = await parser.parse('./document.pdf', 'AGENTIC');
console.log('Job ID:', job.id);

// 2. Esperar resultado con progreso
const result = await parser.waitFor(job.id, {
  onProgress: (job) => console.log(\`Status: \${job.status}\`)
});

console.log('Markdown:', result.markdown);

// 3. Query RAG
const ragResult = await parser.query(
  '¿Cuáles son los horarios de atención?',
  'chatbot_id_xxx',
  { mode: 'accurate' }
);

console.log('Answer:', ragResult.answer);
console.log('Sources:', ragResult.sources);`;

  const curlParserCode = `curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "mode=AGENTIC"

# Response:
# {
#   "id": "job_abc123",
#   "status": "PENDING",
#   "fileName": "document.pdf",
#   "mode": "AGENTIC",
#   "creditsUsed": 3,
#   "createdAt": "2025-01-18T10:00:00Z"
# }`;

  const curlStatusCode = `curl https://formmy-v2.fly.dev/api/parser/v1?intent=status&jobId=job_abc123 \\
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

  const curlRAGCode = `curl -X POST https://formmy-v2.fly.dev/api/rag/v1?intent=query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "¿Cuáles son los horarios de atención?",
    "chatbotId": "chatbot_xxx",
    "mode": "accurate"
  }'

# Response:
# {
#   "query": "¿Cuáles son los horarios de atención?",
#   "answer": "Los horarios de atención son de lunes a viernes...",
#   "sources": [
#     {
#       "content": "Horarios: Lunes a Viernes 9:00 - 18:00",
#       "score": 0.92,
#       "metadata": { "fileName": "info.pdf", "page": 1 }
#     }
#   ],
#   "creditsUsed": 3,
#   "processingTime": 842
# }`;

  const pythonCode = `import requests

# Upload documento
response = requests.post(
    "https://formmy-v2.fly.dev/api/parser/v1?intent=upload",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    files={"file": open("document.pdf", "rb")},
    data={"mode": "AGENTIC"}
)
job = response.json()

# Polling para esperar resultado
import time
while True:
    status_response = requests.get(
        f"https://formmy-v2.fly.dev/api/parser/v1?intent=status&jobId={job['id']}",
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
        <h3 className="text-dark text-base font-semibold mb-1">📖 Documentación API</h3>
        <p className="text-xs text-metal">
          Parser avanzado de documentos + RAG/Búsqueda semántica con IA
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-outlines">
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
        <button
          onClick={() => setDocTab("sdk")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            docTab === "sdk"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-metal hover:text-dark"
          }`}
        >
          📦 TypeScript SDK
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
          </>
        )}

        {/* RAG API Tab */}
        {docTab === "rag" && (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-dark font-semibold mb-1">🔍 RAG / Búsqueda Semántica con IA</p>
              <p className="text-xs text-metal">
                Consulta tu base de conocimiento con búsqueda vectorial. Modo <strong>fast</strong> retorna chunks relevantes. Modo <strong>accurate</strong> genera respuestas naturales con GPT-5 + fuentes citadas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Endpoints</h4>
              <div className="space-y-2">
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-green-700">POST /api/rag/v1?intent=query</p>
                  <p className="text-xs text-metal mt-1">Query con RAG - Búsqueda semántica + respuestas IA</p>
                </div>
                <div className="bg-gray-50 border border-outlines rounded-lg p-2">
                  <p className="text-xs font-mono font-bold text-blue-700">GET /api/rag/v1?intent=list&chatbotId=xxx</p>
                  <p className="text-xs text-metal mt-1">Listar documentos parseados con métricas</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo cURL - Query</h4>
              <CodeSnippet code={curlRAGCode} language="bash" title="cURL - RAG Query" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Modos de Query</h4>
              <div className="space-y-2">
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">fast</p>
                      <p className="text-xs text-metal">Solo retrieval vectorial (sin LLM)</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">1 cr</span>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">accurate</p>
                      <p className="text-xs text-metal">Retrieval + LLM synthesis (respuesta natural)</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">2 cr</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SDK Tab */}
        {docTab === "sdk" && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-dark text-sm mb-1">📦 TypeScript SDK Oficial</h4>
                  <p className="text-xs text-metal mb-3">
                    Cliente completo con tipado TypeScript, auto-polling y manejo de errores. Incluye <strong>Parser API</strong> y <strong>RAG API</strong> en un solo cliente.
                  </p>
                  <ul className="text-xs text-metal space-y-1">
                    <li>✅ Zero dependencies (solo fetch y fs nativos)</li>
                    <li>✅ TypeScript types incluidos para full autocomplete</li>
                    <li>✅ Parser (upload + polling automático) + RAG queries</li>
                    <li>✅ Callbacks de progreso para UX reactivo</li>
                    <li>✅ Manejo automático de errores y retries</li>
                  </ul>
                </div>
                <button
                  onClick={onDownloadSDK}
                  className="flex-shrink-0 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar SDK
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Ejemplo Completo</h4>
              <CodeSnippet code={sdkCode} language="typescript" title="formmy-parser.ts - Full Example" />
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Uso Directo (ES Module)</h4>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-dark font-semibold mb-2">✨ Importa directamente desde CDN</p>
                <code className="block bg-white px-3 py-2 rounded text-xs font-mono text-brand-600 border border-green-200">
                  import {`{FormmyParser}`} from 'https://formmy-v2.fly.dev/sdk/formmy-parser.js';
                </code>
                <p className="text-xs text-metal mt-2">
                  Zero instalación, cero dependencias. Funciona en navegadores modernos y Deno.
                </p>
              </div>
              <div className="bg-gray-50 border border-outlines rounded-lg p-3">
                <p className="text-xs text-dark font-semibold mb-2">📦 O descarga local (Node.js)</p>
                <ol className="text-xs text-dark space-y-2 list-decimal list-inside">
                  <li>Descarga el archivo <code className="bg-white px-1 py-0.5 rounded text-brand-600">formmy-parser.ts</code></li>
                  <li>Colócalo en tu proyecto: <code className="bg-white px-1 py-0.5 rounded text-brand-600">./lib/formmy-parser.ts</code></li>
                  <li>Importa y usa: <code className="bg-white px-1 py-0.5 rounded text-brand-600">import {`{FormmyParser}`} from './lib/formmy-parser'</code></li>
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
