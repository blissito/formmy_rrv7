import React, { useState } from "react";
import { TraceWaterfall } from "./TraceWaterfall";

// Mapeo de modelos internos a nombres públicos
const mapModelToPublic = (model: string | null | undefined): string => {
  if (!model) return "Unknown";
  if (model === "gpt-4o-mini") return "gpt-5-nano";
  return model;
};

// Types para traces reales (alineado con OpenTelemetry GenAI conventions)
interface TraceSpan {
  id: string;
  type:
    | "LLM_CALL"
    | "TOOL_CALL"
    | "SEARCH"
    | "PROCESSING"
    | "RAG_SEARCH"
    | "EMBEDDING";
  name: string;
  startOffset: number;
  durationMs: number;
  tokens?: number;
  cost?: number;
  credits?: number;
  status: "COMPLETED" | "ERROR" | "RUNNING";
  error?: string;
  input?: string; // Prompt/query del span
  output?: string; // Response del span
  metadata?: Record<string, any>; // gen_ai.* attributes
}

interface Trace {
  id: string;
  chatbotId: string;
  chatbotName: string;
  chatbotSlug?: string;
  conversationId?: string;
  sessionId?: string; // Para Langfuse compatibility
  input: string;
  output: string;
  status: "COMPLETED" | "ERROR" | "RUNNING";
  model?: string;
  startTime: Date;
  durationMs: number;
  totalTokens: number;
  totalCost: number;
  creditsUsed: number;
  spans: TraceSpan[];
}

export function ObservabilityPanel({
  chatbots,
  traces: initialTraces,
  traceStats: _initialStats,
}: {
  chatbots: Array<{ id: string; name: string }>;
  traces?: any[];
  traceStats?: any;
}) {
  // _initialStats disponible para futura implementación de métricas del servidor
  const [selectedChatbot, setSelectedChatbot] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  // Convertir traces reales al formato esperado
  const traces: Trace[] =
    initialTraces?.map((trace) => ({
      id: trace.id,
      chatbotId: trace.chatbotId || "unknown",
      chatbotName: trace.chatbot?.name || "Sin chatbot",
      chatbotSlug: trace.chatbot?.slug,
      conversationId: trace.conversationId,
      sessionId: trace.metadata?.sessionId, // Para Langfuse compatibility
      input: trace.input,
      output: trace.output || "Sin respuesta",
      status: trace.status,
      model: mapModelToPublic(trace.model), // 🔍 Mapear modelo a nombre público
      startTime: new Date(trace.startTime),
      durationMs: trace.durationMs || 0,
      totalTokens: trace.totalTokens,
      totalCost: trace.totalCost,
      creditsUsed: trace.creditsUsed,
      spans: trace.spans.map((span: any, index: number, allSpans: any[]) => {
        // Calcular offset basado en spans previos (acumulativo)
        const prevDurations = allSpans
          .slice(0, index)
          .reduce((sum, s) => sum + (s.durationMs || 0), 0);

        // Formatear input/output para display
        const formatIO = (data: any): string => {
          if (!data) return "";
          if (typeof data === "string") return data;
          try {
            return JSON.stringify(data, null, 2);
          } catch {
            return String(data);
          }
        };

        return {
          id: span.id,
          type: span.type,
          name: span.name,
          startOffset: prevDurations,
          durationMs: span.durationMs || 100, // Mínimo 100ms para spans sin duración
          tokens: span.tokens,
          cost: span.cost,
          credits: span.credits,
          status: span.status,
          input: formatIO(span.input),
          output: formatIO(span.output),
          error: span.error,
          // OpenTelemetry GenAI attributes
          metadata: span.metadata,
        };
      }),
    })) || [];

  // Filtrar traces
  const filteredTraces = traces.filter((trace) => {
    const matchesChatbot =
      selectedChatbot === "all" || trace.chatbotId === selectedChatbot;
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
      filteredTraces.reduce((sum, t) => sum + t.durationMs, 0) /
        filteredTraces.length || 0
    ),
    totalTokens: filteredTraces.reduce((sum, t) => sum + t.totalTokens, 0),
    totalCost: filteredTraces.reduce((sum, t) => sum + t.totalCost, 0),
    errorRate:
      (filteredTraces.filter((t) => t.status === "ERROR").length /
        filteredTraces.length) *
        100 || 0,
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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
            Monitorea conversaciones, tokens, costos y performance de tus
            chatbots
          </p>
        </div>
        <button
          onClick={exportToJSON}
          disabled={filteredTraces.length === 0}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Exportar JSON
        </button>
      </div>

      {/* Métricas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Total Traces</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalTraces}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Avg Latency</p>
          <p className="text-2xl font-bold text-green-600">
            {formatDuration(stats.avgLatency)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-metal font-medium mb-1">Error Rate</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.errorRate.toFixed(1)}%
          </p>
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
              <option value="all">Todos los chatbots ({traces.length})</option>
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
        {filteredTraces.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-space-700 mb-4">
              <svg
                className="w-8 h-8 text-metal"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-metal text-base font-medium mb-1">
              No hay traces disponibles
            </p>
            <p className="text-sm text-metal mb-4">
              Los traces se generarán automáticamente cuando tus chatbots
              procesen conversaciones
            </p>
            <div className="text-xs text-metal bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-md mx-auto">
              <strong>💡 Tip:</strong> Interactúa con tus chatbots vía la
              burbuja embebida o API para empezar a ver métricas de
              observabilidad aquí.
            </div>
          </div>
        ) : (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-metal uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outlines">
                {filteredTraces.map((trace) => (
                  <React.Fragment key={trace.id}>
                    <tr
                      onClick={() =>
                        setExpandedTraceId(
                          expandedTraceId === trace.id ? null : trace.id
                        )
                      }
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
                        <span
                          className="cursor-help border-b border-dotted border-metal"
                          title={`Costo: $${trace.totalCost.toFixed(6)}`}
                        >
                          {trace.totalTokens.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 min-w-max">
                          {trace.model || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark dark:text-white">
                        {trace.creditsUsed}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Link a conversación */}
                          {trace.conversationId && trace.chatbotSlug ? (
                            <a
                              href={`/dashboard/chat/${trace.chatbotSlug}?tab=Conversaciones&conversation=${trace.conversationId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors"
                              title="Ver conversación completa (nueva pestaña)"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              Chat
                            </a>
                          ) : (
                            <span className="text-xs text-metal">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedTraceId === trace.id && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-4 bg-gray-50 dark:bg-space-700"
                        >
                          <div className="space-y-3">
                            {/* Output */}
                            <div>
                              <p className="text-xs font-medium text-metal mb-1">
                                Output:
                              </p>
                              <p className="text-sm text-dark dark:text-white bg-white dark:bg-space-800 p-3 rounded-lg border border-outlines">
                                {trace.output}
                              </p>
                            </div>
                            {/* Waterfall */}
                            <div>
                              <p className="text-xs font-medium text-metal mb-2">
                                Timeline:
                              </p>
                              <TraceWaterfall
                                spans={trace.spans}
                                totalDuration={trace.durationMs}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer info - Solo mostrar si hay datos reales */}
      {traces.length > 0 && (
        <div className="text-xs text-metal bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <strong>✅ Datos Reales:</strong> Mostrando {traces.length} trace
          {traces.length !== 1 ? "s" : ""} de los últimos 7 días. Las métricas
          se actualizan automáticamente con cada conversación.
        </div>
      )}
    </div>
  );
}
