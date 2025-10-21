import { useState } from "react";

interface Span {
  id: string;
  type: "LLM_CALL" | "TOOL_CALL" | "RAG_SEARCH" | "EMBEDDING";
  name: string;
  startOffset: number;
  durationMs: number;
  tokens?: number;
  cost?: number;
  credits?: number;
  status: "COMPLETED" | "ERROR";
  error?: string;
  input?: string;
  output?: string;
}

interface TraceWaterfallProps {
  spans: Span[];
  totalDuration: number;
}

const SPAN_COLORS = {
  LLM_CALL: {
    bg: "bg-blue-500",
    text: "text-blue-700",
    border: "border-blue-300",
    bgLight: "bg-blue-100",
  },
  TOOL_CALL: {
    bg: "bg-green-500",
    text: "text-green-700",
    border: "border-green-300",
    bgLight: "bg-green-100",
  },
  RAG_SEARCH: {
    bg: "bg-yellow-500",
    text: "text-yellow-700",
    border: "border-yellow-300",
    bgLight: "bg-yellow-100",
  },
  EMBEDDING: {
    bg: "bg-purple-500",
    text: "text-purple-700",
    border: "border-purple-300",
    bgLight: "bg-purple-100",
  },
};

const SPAN_ICONS = {
  LLM_CALL: "🤖",
  TOOL_CALL: "🔧",
  RAG_SEARCH: "🔍",
  EMBEDDING: "📊",
};

export function TraceWaterfall({ spans, totalDuration }: TraceWaterfallProps) {
  const [hoveredSpan, setHoveredSpan] = useState<string | null>(null);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="bg-white dark:bg-space-800 border border-outlines rounded-lg p-4 space-y-3">
      {/* Timeline header */}
      <div className="flex items-center justify-between text-xs text-metal mb-2">
        <span>0ms</span>
        <span>{formatDuration(totalDuration)}</span>
      </div>

      {/* Timeline bar background */}
      <div className="relative h-2 bg-gray-200 dark:bg-space-700 rounded-full mb-4">
        {spans.map((span) => {
          const leftPercent = (span.startOffset / totalDuration) * 100;
          const widthPercent = (span.durationMs / totalDuration) * 100;
          const colors = SPAN_COLORS[span.type];

          return (
            <div
              key={span.id}
              className={`absolute h-full ${colors.bg} rounded-full transition-opacity ${
                hoveredSpan && hoveredSpan !== span.id ? "opacity-30" : "opacity-100"
              }`}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
              onMouseEnter={() => setHoveredSpan(span.id)}
              onMouseLeave={() => setHoveredSpan(null)}
            />
          );
        })}
      </div>

      {/* Spans list */}
      <div className="space-y-2">
        {spans.map((span) => {
          const colors = SPAN_COLORS[span.type];
          const icon = SPAN_ICONS[span.type];
          const isHovered = hoveredSpan === span.id;

          return (
            <div
              key={span.id}
              onMouseEnter={() => setHoveredSpan(span.id)}
              onMouseLeave={() => setHoveredSpan(null)}
              className={`border ${colors.border} ${
                isHovered ? colors.bgLight : "bg-white dark:bg-space-700"
              } rounded-lg p-3 transition-all cursor-pointer ${
                isHovered ? "shadow-md scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Span header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-semibold text-sm text-dark dark:text-white">
                      {span.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${colors.bgLight} ${colors.text} font-medium`}
                    >
                      {span.type}
                    </span>
                    {span.status === "ERROR" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        ERROR
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-metal flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Duration:</span>
                      <span className="text-dark dark:text-white font-mono">
                        {formatDuration(span.durationMs)}
                      </span>
                    </div>
                    {span.tokens !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Tokens:</span>
                        <span className="text-dark dark:text-white font-mono">
                          {span.tokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {span.cost !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Cost:</span>
                        <span className="text-dark dark:text-white font-mono">
                          ${span.cost.toFixed(6)}
                        </span>
                      </div>
                    )}
                    {span.credits !== undefined && span.credits > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Credits:</span>
                        <span className="text-dark dark:text-white font-mono">{span.credits}</span>
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {span.error && (
                    <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200">
                      <strong>Error:</strong> {span.error}
                    </div>
                  )}

                  {/* Input/Output (expandible en hover) */}
                  {isHovered && (span.input || span.output) && (
                    <div className="mt-3 space-y-2 text-xs">
                      {span.input && (
                        <div>
                          <p className="font-medium text-metal mb-1">Input:</p>
                          <div className="bg-gray-100 dark:bg-space-600 p-2 rounded font-mono text-dark dark:text-white max-h-20 overflow-y-auto">
                            {span.input}
                          </div>
                        </div>
                      )}
                      {span.output && (
                        <div>
                          <p className="font-medium text-metal mb-1">Output:</p>
                          <div className="bg-gray-100 dark:bg-space-600 p-2 rounded font-mono text-dark dark:text-white max-h-20 overflow-y-auto">
                            {span.output}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Timeline visual indicator */}
                <div className="flex flex-col items-end gap-1 min-w-[80px]">
                  <span className="text-xs text-metal">
                    +{formatDuration(span.startOffset)}
                  </span>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-space-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bg}`}
                      style={{
                        width: `${(span.durationMs / totalDuration) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-3 border-t border-outlines flex-wrap">
        <span className="text-xs font-medium text-metal">Legend:</span>
        {Object.entries(SPAN_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 ${colors.bg} rounded-sm`} />
            <span className="text-xs text-metal">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
