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

// 1. Parsear documento GRATIS (DEFAULT mode)
const job = await parser.parse('./document.pdf'); // DEFAULT = gratis
console.log('Job ID:', job.id);
console.log('Créditos usados:', job.creditsUsed); // 0

// 2. O usar parsing avanzado con mayor precisión (costo por página)
const jobPremium = await parser.parse('./document.pdf', 'AGENTIC');
console.log('Créditos usados:', jobPremium.creditsUsed); // 3 * páginas

// 3. Esperar resultado con progreso
const result = await parser.waitFor(job.id, {
  onProgress: (job) => console.log(\`Status: \${job.status}\`)
});

console.log('Markdown:', result.markdown);

// 4. Query RAG
const ragResult = await parser.query(
  '¿Cuáles son los horarios de atención?',
  'chatbot_id_xxx',
  { mode: 'accurate' }
);

console.log('Answer:', ragResult.answer);
console.log('Sources:', ragResult.sources);`;

  const curlParserCode = `# Parsing GRATUITO (default)
curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "mode=DEFAULT"

# Parsing avanzado (costo por página)
curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \\
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
    "chatbotId": "YOUR_CHATBOT_ID",
    "mode": "accurate",
    "topK": 3
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
#   "topK": 3,
#   "creditsUsed": 1.5,
#   "tokensUsed": {
#     "prompt": 1247,
#     "completion": 156,
#     "total": 1403
#   },
#   "processingTime": 842
# }`;

  const pythonCode = `import requests
import time

# Upload documento GRATIS (DEFAULT mode)
response = requests.post(
    "https://formmy-v2.fly.dev/api/parser/v1?intent=upload",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    files={"file": open("document.pdf", "rb")},
    data={"mode": "DEFAULT"}  # GRATIS - 0 créditos
)
job = response.json()
print(f"Job ID: {job['id']} - Créditos: {job['creditsUsed']}")

# Polling para esperar resultado
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
              <p className="text-xs text-dark font-semibold mb-1">🔍 RAG / Búsqueda Semántica con IA</p>
              <p className="text-xs text-metal">
                Consulta tu base de conocimiento con búsqueda vectorial. Modo <strong>fast</strong> retorna chunks relevantes. Modo <strong>accurate</strong> genera respuestas naturales con GPT-5 + fuentes citadas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Endpoints Públicos</h4>
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
                      <p className="text-xs text-metal">Solo retrieval vectorial - Retorna top 5 chunks relevantes</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">0.5 cr</span>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">accurate</p>
                      <p className="text-xs text-metal">Retrieval + GPT-4o-mini - Respuesta en lenguaje natural + fuentes</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600">1.5 cr</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-dark text-sm mb-2">Parámetros Opcionales</h4>
              <div className="space-y-2 text-xs">
                <div className="border border-outlines rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <code className="font-mono text-brand-600">topK</code>
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">OPTIMIZACIÓN</span>
                  </div>
                  <p className="text-metal mb-2">Número de chunks a recuperar (1-10). Default: <strong>3</strong></p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[11px]">
                    <p className="text-blue-800 font-medium mb-1">💡 Mejores Prácticas (2025)</p>
                    <ul className="space-y-0.5 text-blue-700">
                      <li>• <strong>topK=2-3</strong>: Queries simples (90% casos)</li>
                      <li>• <strong>topK=4-5</strong>: Queries complejas</li>
                      <li>• <strong>topK=7-10</strong>: Análisis exhaustivo</li>
                    </ul>
                    <p className="mt-1 text-blue-600"><strong>Ahorro</strong>: topK=3 usa ~40% menos tokens que topK=5</p>
                  </div>
                </div>
                <div className="border border-outlines rounded-lg p-2">
                  <code className="font-mono text-brand-600">contextId</code>
                  <p className="text-metal mt-1">Filtrar búsqueda a un documento específico</p>
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
