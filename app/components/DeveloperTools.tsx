import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "~/lib/utils";

interface RagTesterProps {
  chatbots: Array<{ id: string; name: string }>;
  apiKey: string | undefined;
}

interface DocumentListProps {
  chatbots: Array<{ id: string; name: string }>;
  apiKey: string | undefined;
}

interface ChunkTesterProps {
  chatbotId: string;
  apiKey: string;
  documents: any[]; // Lista de documentos para mostrar de dónde viene cada chunk
}

/**
 * Helper para obtener el nombre de la fuente de un chunk
 * Prioriza: fileName > title > url > 'Unknown'
 */
function getSourceName(metadata: any): string {
  if (metadata?.fileName) return metadata.fileName;
  if (metadata?.title) return metadata.title;
  if (metadata?.url) {
    try {
      const urlObj = new URL(metadata.url);
      return urlObj.hostname;
    } catch {
      return metadata.url;
    }
  }
  return 'Unknown';
}

/**
 * Helper para obtener el emoji del tipo de contexto
 */
function getSourceEmoji(contextType: string): string {
  switch (contextType) {
    case 'FILE': return '📄';
    case 'LINK': return '🔗';
    case 'TEXT': return '📝';
    case 'QUESTION': return '💬';
    default: return '❓';
  }
}

// ===== RAG Tester Component =====
export function RagTester({ chatbots, apiKey }: RagTesterProps) {
  const [selectedChatbot, setSelectedChatbot] = useState(chatbots[0]?.id || "");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testQuery() {
    if (!query.trim() || !apiKey) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/rag/v1?intent=query", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          chatbotId: selectedChatbot,
          mode: "accurate",
          topK
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
        }
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("[RagTester] Error:", err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Error de conexión. ¿El servidor está corriendo?");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!apiKey) {
    return (
      <div className="text-center py-8 text-metal text-sm">
        Crea una API key primero para usar el RAG Tester
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-dark mb-1">
            Chatbot
          </label>
          <select
            value={selectedChatbot}
            onChange={(e) => setSelectedChatbot(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500 bg-white"
          >
            {chatbots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark mb-1">
            Top K <span className="text-purple-600 font-semibold">(chunks)</span>
          </label>
          <select
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-full px-3 py-1.5 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500 bg-white"
          >
            <option value={2}>2 (mínimo)</option>
            <option value={3}>3 (óptimo) ⭐</option>
            <option value={5}>5 (complejo)</option>
            <option value={7}>7 (exhaustivo)</option>
            <option value={10}>10 (máximo)</option>
          </select>
        </div>
        <div className="flex items-end">
          <div className="text-xs text-metal">
            Mode: <span className="font-semibold text-brand-600">Accurate</span> (1.5 cr)
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-dark mb-1">
          Query
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && testQuery()}
            placeholder="Ej: ¿Cuáles son los horarios de atención?"
            className="flex-1 px-3 py-2 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={testQuery}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Testing..." : "Test"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {result && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-800">✓ Results</span>
              {result.topK && (
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  K={result.topK}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-orange-600 font-semibold">
                {result.creditsUsed} cr
              </span>
              {result.tokensUsed && (
                <>
                  <span className="text-metal">•</span>
                  <span className="text-purple-600 font-mono" title={`Prompt: ${result.tokensUsed.prompt} | Completion: ${result.tokensUsed.completion}`}>
                    {result.tokensUsed.total.toLocaleString()} tok
                  </span>
                </>
              )}
              <span className="text-metal">•</span>
              <span className="text-green-600 font-mono">
                {result.processingTime}ms
              </span>
            </div>
          </div>

          {result.answer && (
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-metal mb-2">Answer:</p>
              <div className={cn(
                "prose prose-sm max-w-none",
                "prose-headings:text-dark prose-p:text-dark prose-strong:text-dark prose-strong:font-semibold",
                "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                "prose-p:my-2 prose-p:leading-relaxed",
                "prose-code:text-brand-500 prose-code:bg-brand-100/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
                "text-dark"
              )}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.answer}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {result.sources && result.sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-metal mb-2">
                Sources ({result.sources.length}):
              </p>
              <div className="space-y-2">
                {result.sources.map((source: any, i: number) => (
                  <div key={i} className="bg-white border border-green-200 rounded-lg p-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-mono text-metal">
                        {source.metadata.fileName} {source.metadata.page && `p.${source.metadata.page}`}
                      </span>
                      <span className={`text-xs font-bold ${
                        source.score > 0.8 ? "text-green-600" :
                        source.score > 0.6 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {(source.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-dark line-clamp-2">{source.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.results && result.results.length === 0 && (
            <p className="text-sm text-metal">No se encontraron resultados relevantes.</p>
          )}

          {/* Token Usage Breakdown */}
          {result.tokensUsed && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-800 mb-2">📊 Token Usage</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded p-2">
                  <p className="text-metal mb-0.5">Prompt</p>
                  <p className="font-mono font-bold text-purple-600">{result.tokensUsed.prompt.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-metal mb-0.5">Completion</p>
                  <p className="font-mono font-bold text-purple-600">{result.tokensUsed.completion.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-metal mb-0.5">Total</p>
                  <p className="font-mono font-bold text-purple-700">{result.tokensUsed.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Document List Component =====
export function DocumentList({ chatbots, apiKey }: DocumentListProps) {
  const [selectedChatbot, setSelectedChatbot] = useState(chatbots[0]?.id || "");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChatbot && apiKey) {
      loadDocuments();
    }
  }, [selectedChatbot, apiKey]);

  async function loadDocuments() {
    if (!apiKey) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/rag/v1?intent=list&chatbotId=${selectedChatbot}`,
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`
          }
        }
      );

      console.log('[DocumentList] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[DocumentList] Data received:', data);
        setDocuments(data.contexts || []);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('[DocumentList] Error response:', response.status, errorText);
        setError(`Error ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error("[DocumentList] Error loading documents:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (!apiKey) {
    return (
      <div className="text-center py-8 text-metal text-sm">
        Crea una API key primero para ver tus documentos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-dark mb-1">
          Chatbot
        </label>
        <select
          value={selectedChatbot}
          onChange={(e) => setSelectedChatbot(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500 bg-white"
        >
          {chatbots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-metal text-sm">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-metal text-sm mb-2">
            {error ? "Error al cargar documentos" : "No hay documentos con embeddings activos"}
          </p>
          <p className="text-xs text-metal">
            Sube documentos desde la sección "Archivos" o usa el Parser API
          </p>
        </div>
      ) : (
        <>
          {/* Test Semántico Global */}
          <ChunkTester
            chatbotId={selectedChatbot}
            apiKey={apiKey}
            documents={documents}
          />

          {/* Lista de Documentos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-xs text-blue-700">
              📊 <strong>{documents.length}</strong> documento{documents.length !== 1 ? 's' : ''} con embeddings activos
            </p>
          </div>
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===== Document Card Component =====
function DocumentCard({ document }: { document: any }) {
  const modeBadges: Record<string, { color: string; label: string }> = {
    COST_EFFECTIVE: { color: "yellow", label: "🟡 COST_EFFECTIVE" },
    AGENTIC: { color: "blue", label: "🔵 AGENTIC" },
    AGENTIC_PLUS: { color: "green", label: "🟢 AGENTIC_PLUS" }
  };

  const modeBadge = modeBadges[document.mode] || { color: "gray", label: document.mode };

  const needsReparse = document.mode === "COST_EFFECTIVE" &&
                       document.quality !== null &&
                       document.quality < 0.6;

  const sourceBadge = document.source === "parser_api"
    ? { label: "Parser API", color: "bg-purple-100 text-purple-700" }
    : { label: "Manual", color: "bg-blue-100 text-blue-700" };

  return (
    <div className="border border-outlines rounded-lg p-3 hover:border-brand-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-dark text-sm truncate">
              {document.fileName}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge.color}`}>
              {sourceBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-metal">
            <span>{modeBadge.label}</span>
            {document.pages > 0 && (
              <>
                <span>•</span>
                <span>{document.pages}p</span>
              </>
            )}
            <span>•</span>
            <span>{document.chunks} chunks</span>
            {document.quality !== null && (
              <>
                <span>•</span>
                <span className={`font-semibold ${
                  document.quality > 0.7 ? "text-green-600" :
                  document.quality > 0.5 ? "text-yellow-600" : "text-red-600"
                }`}>
                  Quality: {(document.quality * 100).toFixed(0)}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {needsReparse && (
        <div className="text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-yellow-700">
          ⚠️ Low quality score. Consider re-parsing with AGENTIC mode
        </div>
      )}
    </div>
  );
}

// ===== Chunk Tester Component =====
function ChunkTester({ chatbotId, apiKey, documents }: ChunkTesterProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Crear un mapa de documentos por ID para lookup rápido
  const docsById = documents.reduce((acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {} as Record<string, any>);

  async function testChunks() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/rag/v1?intent=query", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          chatbotId,
          mode: "fast"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Error testing chunks:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Título */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-dark">🔍 Semantic Tester</h4>
        <span className="text-xs text-metal">Test semantic search across all documents</span>
      </div>

      {/* Input de búsqueda */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && testChunks()}
            placeholder="Buscar en todo el contexto del chatbot..."
            className="flex-1 px-3 py-2 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button
            onClick={testChunks}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <p className="text-metal">
            💡 Busca en <strong>todos los documentos</strong> vectorizados (simulando búsqueda real del bot)
          </p>
          <span className="text-orange-600 font-medium">
            0.5 cr/búsqueda
          </span>
        </div>
      </div>

      {/* Resultados */}
      {results && (
        <div className="space-y-2">
          {results.results && results.results.length > 0 ? (
            <>
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <p className="text-sm font-medium text-green-800">
                    {results.results.length} chunk{results.results.length !== 1 ? 's' : ''} encontrado{results.results.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-orange-600 font-semibold">
                    {results.creditsUsed || 0.5} cr
                  </span>
                  <span className="text-metal">•</span>
                  <span className="text-green-600 font-mono">
                    {results.processingTime}ms
                  </span>
                </div>
              </div>

              {results.results.map((chunk: any, i: number) => {
                // Buscar el documento de origen
                const contextId = chunk.metadata?.contextId;
                const sourceDoc = contextId ? docsById[contextId] : null;
                const sourceName = getSourceName(chunk.metadata) || sourceDoc?.fileName || 'Unknown';
                const sourceEmoji = getSourceEmoji(chunk.metadata?.contextType);

                return (
                  <div
                    key={i}
                    className="border border-outlines rounded-lg overflow-hidden hover:border-brand-300 transition-colors"
                  >
                    {/* Header del chunk */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-outlines bg-gray-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-700">
                          #{i + 1}
                        </span>
                        <span className="text-xs text-gray-600 truncate font-medium">
                          {sourceEmoji} {sourceName}
                        </span>
                        {chunk.metadata?.chunkIndex !== undefined && (
                          <span className="text-[10px] text-metal font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            chunk {chunk.metadata.chunkIndex + 1}
                          </span>
                        )}
                        {sourceDoc && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            sourceDoc.source === 'parser_api'
                              ? 'bg-purple-100 text-purple-700'
                              : sourceDoc.source === 'web_source'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {sourceDoc.source === 'parser_api' ? 'Parser' :
                             sourceDoc.source === 'web_source' ? 'Web' :
                             sourceDoc.source === 'text_context' ? 'Text' :
                             sourceDoc.source === 'qa_context' ? 'Q&A' : 'Manual'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          chunk.score > 0.8
                            ? "bg-green-100 text-green-700"
                            : chunk.score > 0.6
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {(chunk.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Contenido del chunk */}
                    <div className="p-3 bg-white">
                      <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-800 mb-1">
                    No se encontraron resultados
                  </p>
                  <p className="text-xs text-orange-700 mb-2">
                    Tu búsqueda "{query}" no tiene coincidencias semánticas en los documentos.
                  </p>
                  <div className="text-xs text-orange-600">
                    <p className="font-medium mb-1">Intenta:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      <li>Usar términos más específicos del contenido</li>
                      <li>Reformular la pregunta de otra manera</li>
                      <li>Verificar que los documentos tengan embeddings activos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
