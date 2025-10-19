import { useState, useCallback, useEffect } from "react";
import type { Chatbot, User, Plans } from "@prisma/client";
import { cn } from "~/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Tipos
type ParsingMode = "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS";

type ParsingStatus = "idle" | "uploading" | "parsing" | "success" | "error";

interface ParsedResult {
  markdown: string;
  mode: ParsingMode;
  fileName: string;
  pages?: number;
  processingTime?: number;
}

const PARSING_MODES = [
  {
    id: "COST_EFFECTIVE" as ParsingMode,
    label: "Cost Effective",
    description: "Rápido y económico, ideal para documentos con mucho texto",
    icon: "⚡",
    credits: 1,
    speed: "Muy rápido",
  },
  {
    id: "AGENTIC" as ParsingMode,
    label: "Agentic",
    description: "Balance óptimo, maneja imágenes y diagramas",
    icon: "🎯",
    isDefault: true,
    credits: 3,
    speed: "Rápido",
  },
  {
    id: "AGENTIC_PLUS" as ParsingMode,
    label: "Agentic Plus",
    description: "Máxima fidelidad para layouts complejos y tablas",
    icon: "✨",
    credits: 6,
    speed: "Moderado",
  },
];

const ALLOWED_PLANS: Plans[] = ["PRO", "ENTERPRISE", "TRIAL"];

interface ParsingJob {
  id: string;
  fileName: string;
  mode: ParsingMode;
  status: string;
  creditsUsed: number;
  pages?: number;
  processingTime?: number;
  createdAt: string;
  errorMessage?: string;
}

export const ExtraccionAvanzada = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  const [selectedMode, setSelectedMode] = useState<ParsingMode>("AGENTIC");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ParsingStatus>("idle");
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<ParsingJob[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Opciones avanzadas
  const [advancedOptions, setAdvancedOptions] = useState({
    extractTables: true,
    extractImages: true,
    preserveFormatting: true,
    convertDiagramsToMermaid: false,
    convertEquationsToLatex: false,
  });

  const hasAccess = ALLOWED_PLANS.includes(user.plan);

  // Polling para job status
  useEffect(() => {
    if (!jobId || status === "success" || status === "error") return;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/v1/llamaparse?intent=get_job&jobId=${jobId}`);
        const data = await res.json();

        if (data.success && data.job) {
          const job = data.job;

          if (job.status === "COMPLETED") {
            setParsedResult({
              markdown: job.resultMarkdown,
              mode: job.mode,
              fileName: job.fileName,
              pages: job.pages,
              processingTime: job.processingTime,
            });
            setStatus("success");
            setJobId(null);
            localStorage.removeItem(`parsing_job_${chatbot.id}`);
          } else if (job.status === "FAILED") {
            setError(job.errorMessage || "Error procesando documento");
            setStatus("error");
            setJobId(null);
            localStorage.removeItem(`parsing_job_${chatbot.id}`);
          }
          // Si está PENDING o PROCESSING, continuar polling
        }
      } catch (err) {
        console.error("Error polling job:", err);
      }
    };

    // Poll cada 2 segundos
    const interval = setInterval(pollJob, 2000);

    // Poll inmediato
    pollJob();

    return () => clearInterval(interval);
  }, [jobId, status, chatbot.id]);

  // Restaurar job al montar componente
  useEffect(() => {
    const savedJobId = localStorage.getItem(`parsing_job_${chatbot.id}`);
    if (savedJobId) {
      setJobId(savedJobId);
      setStatus("parsing");
    }
  }, [chatbot.id]);

  // Cargar historial de jobs
  useEffect(() => {
    if (!hasAccess) return;

    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/v1/llamaparse?intent=get_jobs&limit=5`);
        const data = await res.json();

        if (data.success && data.jobs) {
          setRecentJobs(data.jobs);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };

    fetchJobs();
  }, [hasAccess, status]); // Refetch cuando cambia status (completado un job)

  // Handlers
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setParsedResult(null);
    setStatus("idle");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        // Validar tipo de archivo
        const validTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
        ];

        if (validTypes.includes(file.type) || file.name.endsWith(".pdf")) {
          handleFileSelect(file);
        } else {
          setError(
            "Tipo de archivo no soportado. Usa PDF, DOCX, XLSX o TXT."
          );
        }
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleProcess = async () => {
    if (!selectedFile || !hasAccess) return;

    setStatus("parsing");
    setError(null);

    try {
      // Crear job de parsing
      const formData = new FormData();
      formData.append("intent", "create_job");
      formData.append("chatbotId", chatbot.id);
      formData.append("fileName", selectedFile.name);
      formData.append("fileSize", Math.round(selectedFile.size / 1024).toString()); // KB
      formData.append("fileType", selectedFile.type || "application/octet-stream");
      formData.append("mode", selectedMode);
      formData.append("options", JSON.stringify(advancedOptions));

      const res = await fetch("/api/v1/llamaparse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Error creando job");
      }

      // Guardar jobId y comenzar polling
      const newJobId = data.jobId;
      setJobId(newJobId);
      localStorage.setItem(`parsing_job_${chatbot.id}`, newJobId);
    } catch (err) {
      console.error("Error creating parsing job:", err);
      setError(err instanceof Error ? err.message : "Error del servidor");
      setStatus("error");
    }
  };

  const handleAddToContext = async () => {
    if (!parsedResult) return;

    // TODO: Implementar guardado en contexto
    alert(
      `Próximamente: Agregar resultado al contexto del chatbot\n\nArchivo: ${parsedResult.fileName}\nModo: ${parsedResult.mode}`
    );
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResult(null);
    setStatus("idle");
    setError(null);
    setJobId(null);
    localStorage.removeItem(`parsing_job_${chatbot.id}`);
  };

  const selectedModeData = PARSING_MODES.find((m) => m.id === selectedMode);
  const estimatedCredits = selectedModeData?.credits || 0;

  return (
    <div className="space-y-5">
      {/* Header ejecutivo */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">
            Extracción Avanzada
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Procesamiento inteligente de documentos complejos
          </p>
        </div>
        {!hasAccess && (
          <div className="px-3 py-1.5 bg-brand-500/10 text-brand-600 text-xs font-semibold rounded-lg border border-brand-200">
            PRO/Enterprise
          </div>
        )}
      </div>

      {/* Selector de modo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900">
            Modo de Procesamiento
          </label>
          <span className="text-xs text-gray-500">Selecciona según complejidad del documento</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PARSING_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              disabled={!hasAccess}
              className={cn(
                "relative p-3 rounded-xl border transition-all text-left group",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selectedMode === mode.id
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm"
              )}
            >
              <div className="space-y-2">
                {/* Header del modo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mode.icon}</span>
                    <h4 className={cn(
                      "font-semibold text-sm",
                      selectedMode === mode.id ? "text-brand-700" : "text-gray-900"
                    )}>
                      {mode.label}
                    </h4>
                  </div>
                  {selectedMode === mode.id && (
                    <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Métricas compactas */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-purple-700 font-semibold">
                    <span>💎</span>
                    <span>{mode.credits}</span>
                  </div>
                  <div className="h-3 w-px bg-gray-300"></div>
                  <span className="text-gray-600">{mode.speed}</span>
                </div>

                {/* Descripción compacta */}
                <p className="text-xs text-gray-600 leading-tight">
                  {mode.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zona de archivo */}
      {!parsedResult && (
        <div className="space-y-3">
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
                isDragging
                  ? "border-brand-500 bg-brand-50 scale-[1.01]"
                  : "border-gray-300 bg-white hover:border-brand-400 hover:bg-gray-50",
                !hasAccess && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.txt"
                disabled={!hasAccess}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <label
                htmlFor="file-upload"
                className={cn(
                  "cursor-pointer",
                  !hasAccess && "cursor-not-allowed"
                )}
              >
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Selecciona o arrastra tu documento
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOCX, XLSX, TXT • Máx 50MB
                    </p>
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Opciones de Extracción */}
      {!parsedResult && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Opciones de Extracción
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(advancedOptions).map(([key, value]) => (
              <label
                key={key}
                className="flex items-center gap-2.5 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={value}
                  disabled={!hasAccess}
                  onChange={(e) =>
                    setAdvancedOptions({
                      ...advancedOptions,
                      [key]: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 disabled:opacity-50"
                />
                <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Botón de procesamiento */}
      {!parsedResult && selectedFile && (
        <div className="space-y-3 pt-2">
          <button
            onClick={handleProcess}
            disabled={!hasAccess || status === "parsing"}
            className={cn(
              "w-full py-3.5 px-5 rounded-xl font-semibold transition-all",
              "bg-gradient-to-r from-brand-500 to-brand-600 text-white",
              "hover:shadow-lg hover:scale-[1.02]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "flex items-center justify-center gap-3"
            )}
          >
            {status === "parsing" ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Procesar Documento</span>
                <div className="ml-auto flex items-center gap-1 text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
                  <span className="text-xs">💎</span>
                  <span>{estimatedCredits}</span>
                </div>
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500">
            {selectedModeData?.label} • {selectedModeData?.speed}
          </p>
        </div>
      )}

      {/* Resultado */}
      {parsedResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Header del resultado */}
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-900">
                  Procesamiento Completado
                </h4>
                <p className="text-sm text-green-700">
                  {parsedResult.pages} páginas · {parsedResult.processingTime}s
                  · Modo: {parsedResult.mode}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Procesar otro
            </button>
          </div>

          {/* Vista previa markdown */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">
                Vista Previa del Contenido Extraído
              </h4>
            </div>
            <div className="p-6 bg-white max-h-96 overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {parsedResult.markdown}
              </ReactMarkdown>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToContext}
              className="flex-1 py-3 px-4 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              Agregar al Contexto del Chatbot
            </button>
            <button
              onClick={() => {
                const blob = new Blob([parsedResult.markdown], {
                  type: "text/markdown",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${parsedResult.fileName}.md`;
                a.click();
              }}
              className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Descargar Markdown
            </button>
          </div>
        </div>
      )}

      {/* Historial de Parsings */}
      {hasAccess && recentJobs.length > 0 && !parsedResult && (
        <div className="mt-8 space-y-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-semibold text-gray-900">
              Historial Reciente ({recentJobs.length})
            </h4>
            <svg
              className={cn(
                "w-5 h-5 text-gray-500 transition-transform",
                showHistory && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showHistory && (
            <div className="space-y-2 animate-fade-in">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {job.fileName}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            job.status === "COMPLETED" &&
                              "bg-green-100 text-green-700",
                            job.status === "PROCESSING" &&
                              "bg-blue-100 text-blue-700",
                            job.status === "PENDING" &&
                              "bg-yellow-100 text-yellow-700",
                            job.status === "FAILED" && "bg-red-100 text-red-700"
                          )}
                        >
                          {job.status === "COMPLETED" && "✓ Completado"}
                          {job.status === "PROCESSING" && "⏳ Procesando"}
                          {job.status === "PENDING" && "⏸ Pendiente"}
                          {job.status === "FAILED" && "✗ Error"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>
                          {PARSING_MODES.find((m) => m.id === job.mode)?.label ||
                            job.mode}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span>💎</span>
                          {job.creditsUsed}
                        </span>
                        {job.pages && (
                          <>
                            <span>•</span>
                            <span>{job.pages} páginas</span>
                          </>
                        )}
                        {job.processingTime && (
                          <>
                            <span>•</span>
                            <span>{job.processingTime.toFixed(1)}s</span>
                          </>
                        )}
                      </div>
                      {job.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">
                          {job.errorMessage}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
