import { useState } from "react";
import { TraceWaterfall } from "./TraceWaterfall";

// Mapeo de modelos internos a nombres públicos
const mapModelToPublic = (model: string | null | undefined): string => {
  if (!model) return "Unknown";
  if (model === "gpt-4o-mini") return "gpt-5-nano";
  return model;
};

// Mock data types
interface MockSpan {
  id: string;
  type: "LLM_CALL" | "TOOL_CALL" | "RAG_SEARCH" | "EMBEDDING";
  name: string;
  startOffset: number; // ms desde el inicio del trace
  durationMs: number;
  tokens?: number;
  cost?: number;
  credits?: number;
  status: "COMPLETED" | "ERROR";
  error?: string;
  input?: string;
  output?: string;
}

interface MockTrace {
  id: string;
  chatbotId: string;
  chatbotName: string;
  input: string;
  output: string;
  status: "COMPLETED" | "ERROR" | "RUNNING";
  model?: string; // Modelo usado (público: gpt-5-nano, gpt-4o, etc.)
  startTime: Date;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  creditsUsed: number;
  spans: MockSpan[];
}

// Generar datos mock realistas
const generateMockTraces = (): MockTrace[] => {
  const chatbots = [
    { id: "chatbot_1", name: "Asistente Ventas" },
    { id: "chatbot_2", name: "Soporte Técnico" },
    { id: "chatbot_3", name: "FAQ Bot" },
  ];

  const sampleQueries = [
    { input: "¿Cuáles son los precios de los planes?", hasRAG: true, hasTools: false },
    { input: "Envía un email a maria@empresa.com con la propuesta", hasRAG: false, hasTools: true },
    { input: "¿Qué incluye el plan PRO?", hasRAG: true, hasTools: false },
    { input: "Horarios de atención al cliente", hasRAG: true, hasTools: false },
    { input: "Crea un link de pago por $500 MXN", hasRAG: false, hasTools: true },
    { input: "¿Tienen descuentos para estudiantes?", hasRAG: true, hasTools: false },
    { input: "Busca en Google información sobre Formmy", hasRAG: false, hasTools: true },
    { input: "¿Cómo puedo contactarlos?", hasRAG: true, hasTools: false },
    { input: "Dame la lista de mis chatbots", hasRAG: false, hasTools: true },
    { input: "¿Qué es Formmy?", hasRAG: true, hasTools: false },
  ];

  const traces: MockTrace[] = [];
  const now = Date.now();

  for (let i = 0; i < 20; i++) {
    const chatbot = chatbots[Math.floor(Math.random() * chatbots.length)];
    const query = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
    const isError = Math.random() < 0.05; // 5% error rate

    const spans: MockSpan[] = [];
    let currentOffset = 0;

    // RAG Search span (si aplica)
    if (query.hasRAG) {
      const ragDuration = 200 + Math.random() * 300;
      spans.push({
        id: `span_rag_${i}`,
        type: "RAG_SEARCH",
        name: "search_context",
        startOffset: currentOffset,
        durationMs: Math.round(ragDuration),
        credits: 2,
        status: "COMPLETED",
        input: query.input,
        output: "Found 3 relevant documents",
      });
      currentOffset += ragDuration;
    }

    // Tool Call span (si aplica)
    if (query.hasTools) {
      const toolDuration = 300 + Math.random() * 500;
      const toolNames = ["send_gmail", "create_payment_link", "web_search_google", "query_chatbots"];
      spans.push({
        id: `span_tool_${i}`,
        type: "TOOL_CALL",
        name: toolNames[Math.floor(Math.random() * toolNames.length)],
        startOffset: currentOffset,
        durationMs: Math.round(toolDuration),
        credits: 3,
        status: "COMPLETED",
      });
      currentOffset += toolDuration;
    }

    // Modelos internos aleatorios para datos mock (se generan PRIMERO)
    const modelsInternal = ["gpt-4o-mini", "gpt-4o", "claude-3-5-haiku"];
    const randomInternalModel = modelsInternal[Math.floor(Math.random() * modelsInternal.length)];

    // LLM Call span (siempre)
    const llmDuration = 1200 + Math.random() * 1500;
    const llmTokens = 800 + Math.floor(Math.random() * 1500);
    spans.push({
      id: `span_llm_${i}`,
      type: "LLM_CALL",
      name: mapModelToPublic(randomInternalModel), // ✅ Usa modelo aleatorio mapeado
      startOffset: currentOffset,
      durationMs: Math.round(llmDuration),
      tokens: llmTokens,
      cost: (llmTokens / 1_000_000) * 0.15,
      credits: 0, // LLM no consume créditos Formmy
      status: isError ? "ERROR" : "COMPLETED",
      error: isError ? "Rate limit exceeded" : undefined,
    });

    const totalDuration = currentOffset + llmDuration;
    const totalTokens = llmTokens;
    const totalCost = spans.reduce((sum, s) => sum + (s.cost || 0), 0);
    const creditsUsed = spans.reduce((sum, s) => sum + (s.credits || 0), 0);

    traces.push({
      id: `trace_${i}_${Date.now()}`,
      chatbotId: chatbot.id,
      chatbotName: chatbot.name,
      input: query.input,
      output: isError
        ? "Error: No se pudo procesar la solicitud"
        : `Respuesta generada para: ${query.input}`,
      status: isError ? "ERROR" : "COMPLETED",
      model: mapModelToPublic(randomInternalModel), // 🔍 Mapear a nombre público
      startTime: new Date(now - (i * 3600000) - Math.random() * 3600000), // Últimas 20 horas
      durationMs: Math.round(totalDuration),
      totalTokens,
      totalCost,
      creditsUsed,
      spans,
    });
  }

  return traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

export function ObservabilityPanel({
  chatbots,
  traces: initialTraces,
  traceStats: initialStats,
}: {
  chatbots: Array<{ id: string; name: string }>;
  traces?: any[];
  traceStats?: any;
}) {
  // Usar datos reales si están disponibles, sino generar mock
  const [mockTraces] = useState<MockTrace[]>(() =>
    !initialTraces || initialTraces.length === 0 ? generateMockTraces() : []
  );

  const [selectedChatbot, setSelectedChatbot] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  // Convertir traces reales al formato esperado
  const realTraces: MockTrace[] =
    initialTraces?.map((trace) => ({
      id: trace.id,
      chatbotId: trace.chatbotId || "unknown",
      chatbotName: trace.chatbot?.name || "Sin chatbot",
      input: trace.input,
      output: trace.output || "Sin respuesta",
      status: trace.status,
      model: mapModelToPublic(trace.model), // 🔍 Mapear modelo a nombre público
      startTime: new Date(trace.startTime),
      durationMs: trace.durationMs || 0,
      totalTokens: trace.totalTokens,
      totalCost: trace.totalCost,
      creditsUsed: trace.creditsUsed,
      spans: trace.spans.map((span: any, index: number) => ({
        id: span.id,
        type: span.type,
        name: span.name,
        startOffset: index === 0 ? 0 : (span.durationMs || 0) * index,
        durationMs: span.durationMs || 0,
        tokens: span.tokens,
        cost: span.cost,
        credits: span.credits,
        status: span.status,
      })),
    })) || [];

  // Usar traces reales o mock
  const tracesData = realTraces.length > 0 ? realTraces : mockTraces;

  // Filtrar traces
  const filteredTraces = tracesData.filter((trace) => {
    const matchesChatbot = selectedChatbot === "all" || trace.chatbotId === selectedChatbot;
    const matchesSearch =
      searchQuery === "" ||
      trace.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trace.output.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChatbot && matchesSearch;
  });

  // Calcular métricas agregadas
  const stats = {
    totalTraces: filteredTraces.length,
    avgLatency: Math.round(
      filteredTraces.reduce((sum, t) => sum + t.durationMs, 0) / filteredTraces.length || 0
    ),
    totalTokens: filteredTraces.reduce((sum, t) => sum + t.totalTokens, 0),
    totalCost: filteredTraces.reduce((sum, t) => sum + t.totalCost, 0),
    errorRate: (filteredTraces.filter((t) => t.status === "ERROR").length / filteredTraces.length) * 100 || 0,
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredTraces, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `formmy-traces-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-space-800 dark:text-white">
            Observability & Tracing
          </h2>
          <p className="text-sm text-metal mt-1">
            Monitorea conversaciones, tokens, costos y performance de tus chatbots
          </p>
        </div>
        <button
          onClick={exportToJSON}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar JSON
        </button>
      </div>

      {/* Métricas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Total Traces</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalTraces}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Avg Latency</p>
          <p className="text-2xl font-bold text-green-600">{formatDuration(stats.avgLatency)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Error Rate</p>
          <p className="text-2xl font-bold text-red-600">{stats.errorRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-space-800 border border-outlines rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-dark dark:text-white mb-1.5">
              Chatbot
            </label>
            <select
              value={selectedChatbot}
              onChange={(e) => setSelectedChatbot(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500 bg-white dark:bg-space-700"
            >
              <option value="all">Todos los chatbots ({mockTraces.length})</option>
              {chatbots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark dark:text-white mb-1.5">
              Buscar
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por input o output..."
              className="w-full px-3 py-2 text-sm border border-outlines rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Traces */}
      <div className="bg-white dark:bg-space-800 border border-outlines rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-space-700 border-b border-outlines">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Chatbot
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Input
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                  Credits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outlines">
              {filteredTraces.map((trace) => (
                <>
                  <tr
                    key={trace.id}
                    onClick={() => setExpandedTraceId(expandedTraceId === trace.id ? null : trace.id)}
                    className="hover:bg-gray-50 dark:hover:bg-space-700 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {trace.startTime.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {trace.chatbotName}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark dark:text-white max-w-xs truncate">
                      {trace.input}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          trace.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : trace.status === "ERROR"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {trace.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {formatDuration(trace.durationMs)}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {trace.totalTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {trace.model || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark dark:text-white">
                      {trace.creditsUsed}
                    </td>
                  </tr>
                  {expandedTraceId === trace.id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-space-700">
                        <div className="space-y-3">
                          {/* Output */}
                          <div>
                            <p className="text-xs font-medium text-metal mb-1">Output:</p>
                            <p className="text-sm text-dark dark:text-white bg-white dark:bg-space-800 p-3 rounded-lg border border-outlines">
                              {trace.output}
                            </p>
                          </div>
                          {/* Waterfall */}
                          <div>
                            <p className="text-xs font-medium text-metal mb-2">Timeline:</p>
                            <TraceWaterfall spans={trace.spans} totalDuration={trace.durationMs} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTraces.length === 0 && (
          <div className="text-center py-8">
            <p className="text-metal text-sm">No se encontraron traces</p>
          </div>
        )}
      </div>

      {/* Footer info - Solo mostrar si usamos datos mock */}
      {mockTraces.length > 0 && realTraces.length === 0 && (
        <div className="text-xs text-metal bg-blue-50 border border-blue-200 rounded-lg p-3">
          <strong>ℹ️ Datos de Ejemplo:</strong> No hay traces reales todavía. Estos son datos de ejemplo para que explores la interfaz. Los traces se generarán automáticamente cuando uses tus chatbots.
        </div>
      )}

      {/* Mostrar mensaje si hay datos reales */}
      {realTraces.length > 0 && (
        <div className="text-xs text-metal bg-green-50 border border-green-200 rounded-lg p-3">
          <strong>✅ Datos Reales:</strong> Mostrando {realTraces.length} trace{realTraces.length !== 1 ? 's' : ''} de los últimos 7 días. Las métricas se actualizan automáticamente con cada conversación.
        </div>
      )}
    </div>
  );
}
