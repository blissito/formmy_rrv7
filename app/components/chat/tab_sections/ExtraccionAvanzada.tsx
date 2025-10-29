import { useState, useCallback, useEffect } from "react";
import type { Chatbot, User, Plans } from "@prisma/client";
import { cn } from "~/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "../common/Card";
import { ListFiles } from "../ListFiles";

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
    creditsPerPage: 1,
    pricing: "1 crédito/página",
    speed: "Muy rápido",
  },
  {
    id: "AGENTIC" as ParsingMode,
    label: "Agentic",
    description: "Balance óptimo, maneja imágenes y diagramas",
    icon: "🎯",
    isDefault: true,
    creditsPerPage: 3,
    pricing: "3 créditos/página",
    speed: "Rápido",
  },
  {
    id: "AGENTIC_PLUS" as ParsingMode,
    label: "Agentic Plus",
    description: "Máxima fidelidad para layouts complejos y tablas",
    icon: "✨",
    creditsPerPage: 6,
    pricing: "6 créditos/página",
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
  const [isAddingToContext, setIsAddingToContext] = useState(false);
  const [hasAddedToContext, setHasAddedToContext] = useState(false);
  const [estimatedPages, setEstimatedPages] = useState<number | null>(null);
  const [isEstimatingPages, setIsEstimatingPages] = useState(false);

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

  // Re-estimar cuando cambie el modo de parsing
  useEffect(() => {
    if (selectedFile) {
      estimateCost(selectedFile, selectedMode);
    }
  }, [selectedMode]); // Solo selectedMode, no selectedFile para evitar loop

  // Estimar páginas y costo en el servidor (preciso)
  const estimateCost = useCallback(async (file: File, mode: ParsingMode) => {
    setIsEstimatingPages(true);
    try {
      const formData = new FormData();
      formData.append("intent", "estimate_cost");
      formData.append("mode", mode);
      formData.append("file", file);

      const res = await fetch("/api/v1/llamaparse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Error estimando costo");
      }

      setEstimatedPages(data.pages);
    } catch (err) {
      // Fallback: estimación básica
      const estimatedPages = Math.max(1, Math.ceil(file.size / (1024 * 200)));
      setEstimatedPages(estimatedPages);
    } finally {
      setIsEstimatingPages(false);
    }
  }, []);

  // Handlers
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setParsedResult(null);
    setStatus("idle");
    setEstimatedPages(null);

    // Estimar costo con el modo actual
    estimateCost(file, selectedMode);
  }, [estimateCost, selectedMode]);

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
      formData.append("file", selectedFile); // ⭐ Agregar archivo real

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
    if (!parsedResult || isAddingToContext || hasAddedToContext) return;

    setIsAddingToContext(true);

    try {
      const formData = new FormData();
      formData.append("intent", "add_to_context");
      formData.append("chatbotId", chatbot.id);
      formData.append("markdown", parsedResult.markdown);
      formData.append("fileName", parsedResult.fileName);

      const res = await fetch("/api/v1/llamaparse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Error agregando al contexto");
      }

      // Marcar como agregado exitosamente
      setHasAddedToContext(true);

      alert(
        `✅ Éxito!\n\n${data.embeddingsCreated} fragmentos agregados al contexto del chatbot.\n\nYa puedes hacer preguntas sobre "${parsedResult.fileName}" en tus conversaciones.`
      );
    } catch (err) {
      console.error("Error adding to context:", err);
      alert(
        `❌ Error: ${err instanceof Error ? err.message : "Error del servidor"}`
      );
    } finally {
      setIsAddingToContext(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResult(null);
    setStatus("idle");
    setError(null);
    setJobId(null);
    setHasAddedToContext(false); // Reset flag
    localStorage.removeItem(`parsing_job_${chatbot.id}`);
  };

  const selectedModeData = PARSING_MODES.find((m) => m.id === selectedMode);

  // Calcular créditos estimados
  const estimatedCredits = estimatedPages && selectedModeData
    ? estimatedPages * selectedModeData.creditsPerPage
    : null;

  // Calcular créditos disponibles del usuario
  const userCreditsAvailable = user.plan === 'STARTER' ? 200
    : user.plan === 'PRO' ? 1000
    : user.plan === 'ENTERPRISE' ? 5000
    : user.plan === 'TRIAL' ? 1000
    : 0;

  const creditsUsedThisMonth = user.toolCreditsUsed || 0;
  const purchasedCredits = user.purchasedCredits || 0;
  const totalAvailable = (userCreditsAvailable - creditsUsedThisMonth) + purchasedCredits;

  const hasEnoughCredits = estimatedCredits ? totalAvailable >= estimatedCredits : true;

  return (
    <>
    <Card
      title="Extracción Avanzada"
      text={
        <span>
          Procesamiento inteligente de documentos complejos con LlamaParse. Selecciona el modo de procesamiento según complejidad del documento. {" "}
          {!hasAccess && (
            <span className="inline-flex items-center px-2 py-0.5 bg-brand-500/10 text-brand-600 text-xs font-semibold rounded-lg border border-brand-200 ml-2">
              PRO/Enterprise
            </span>
          )}
        </span>
      }
    >
      <div className="space-y-5">
      {/* Selector de modo */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PARSING_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              disabled={!hasAccess}
              className={cn(
                "relative px-3 pt-2 pb-3 rounded-2xl border transition-all text-left group",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selectedMode === mode.id
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-outlines bg-white hover:border-brand-300 hover:shadow-sm"
              )}
            >
              <div className="space-y-1">
                {/* Header del modo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
               
                    <h4 className={cn(
                      "font-semibold text-sm",
                      selectedMode === mode.id ? "text-brand-700" : "text-dark"
                    )}>
                      {mode.label}          <span className="text-xl">{mode.icon}</span>          
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
                <div className="flex items-center text-xs ">
                  <div className="flex items-center gap-1 text-metal font-semibold">
                    <span>{mode.pricing}</span>
                  </div>
                </div>
                {/* Descripción compacta */}
                <p className="text-xs text-irongray leading-tight pt-1">
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
                "group cursor-pointer bg-gray-50",
                "grid place-content-center place-items-center border-dashed border rounded-3xl h-[120px] px-4 transition-all",
                isDragging
                  ? "border-brand-500 bg-brand-500/20"
                  : "border-gray-300",
                !hasAccess && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="file"
                id="file-upload-advanced"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.txt"
                disabled={!hasAccess}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <label
                htmlFor="file-upload-advanced"
                className={cn(
                  "cursor-pointer w-full h-full flex flex-col items-center justify-center",
                  !hasAccess && "cursor-not-allowed"
                )}
              >
                <span className="group-hover:scale-110 transition-all">
                  <img src="/assets/chat/upload.svg" alt="upload icon" />
                </span>
                <h4 className="text-xs text-gray-500 font-medium text-center mt-2">
                  Arrastra los archivos aquí o selecciona desde tu computadora
                </h4>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Puedes subir archivos .pdf, .docx, .xlsx o .txt • Máx 50MB
                </p>
              </label>
            </div>
          ) : (
            <ListFiles
              files={[selectedFile]}
              onRemoveFile={handleReset}
              mode="local"
            />
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
        <div className="bg-surfaceTwo rounded-2xl p-4 border border-outlines">
          <h4 className="text-sm font-semibold text-dark mb-3">
            Opciones de Extracción
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  className="w-4 h-4 text-brand-500 border-outlines rounded focus:ring-brand-500 disabled:opacity-50"
                />
                <span className="text-metal group-hover:text-dark font-regular">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* API Access Banner */}
      {hasAccess && (
        <div className="bg-cloud/20 border border-cloud/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cloud to-bird flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-dark text-sm">
                API REST Disponible
              </h4>
              <p className="text-xs text-metal mt-1">
                Integra el Parser Avanzado en tus propias aplicaciones. Genera API keys, consulta docs y ejemplos de código en cURL, TypeScript y Python.
              </p>
              <a
                href="/dashboard/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-teal-700 hover:text-teal-600 transition-colors"
              >
                <span>Ver API Keys y Documentación</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Botón de procesamiento */}
      {!parsedResult && selectedFile && (
        <div className="space-y-3 pt-2">
          {/* Estimación de créditos */}
          {estimatedPages !== null && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-medium">Estimación:</span>
                  <span className="text-gray-700">
                    {isEstimatingPages ? (
                      "Calculando páginas..."
                    ) : (
                      `~${estimatedPages} página${estimatedPages !== 1 ? 's' : ''}`
                    )}
                  </span>
                </div>
                {estimatedCredits && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-700 font-semibold">
                      💎 {estimatedCredits} créditos
                    </span>
                  </div>
                )}
              </div>
              {!hasEnoughCredits && estimatedCredits && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Créditos insuficientes. Disponibles: {totalAvailable}, Requeridos: {estimatedCredits}
                  </p>
                  <a
                    href="/dashboard/plan"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900"
                  >
                    <span>Comprar más créditos</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={!hasAccess || status === "parsing" || !hasEnoughCredits}
            className={cn(
              "w-full py-3.5 px-5 rounded-2xl font-semibold transition-all",
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
                {estimatedCredits && (
                  <div className="ml-auto flex items-center gap-1 text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
                    <span className="text-xs">💎</span>
                    <span>{estimatedCredits} créditos</span>
                  </div>
                )}
              </>
            )}
          </button>
          <p className="text-center text-xs text-metal">
            {selectedModeData?.label} • {selectedModeData?.speed}
            {totalAvailable > 0 && ` • ${totalAvailable} créditos disponibles`}
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
              className="px-4 py-2 text-sm font-medium text-metal bg-white border border-outlines rounded-2xl hover:bg-gray-50"
            >
              Procesar otro
            </button>
          </div>

          {/* Vista previa markdown */}
          <div className="border-2 border-outlines rounded-2xl overflow-hidden">
            <div className="bg-surfaceTwo px-4 py-3 border-b border-outlines">
              <h4 className="font-semibold text-dark">
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
              disabled={isAddingToContext || hasAddedToContext}
              className={cn(
                "flex-1 py-3 px-4 rounded-2xl font-medium transition-colors",
                "flex items-center justify-center gap-2",
                hasAddedToContext
                  ? "bg-green-500 text-white cursor-not-allowed"
                  : isAddingToContext
                  ? "bg-brand-500 text-white opacity-75 cursor-wait"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              )}
            >
              {hasAddedToContext ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Agregado al Contexto</span>
                </>
              ) : isAddingToContext ? (
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
                  <span>Agregando al contexto...</span>
                </>
              ) : (
                "Agregar al Contexto del Chatbot"
              )}
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
              className="px-6 py-3 bg-white text-metal border-2 border-outlines rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            >
              Descargar Markdown
            </button>
          </div>
        </div>
      )}

      </div>
    </Card>

    {/* Historial de Parsings */}
    {hasAccess && recentJobs.length > 0 && !parsedResult && (
      <Card
        title={`Historial Reciente (${recentJobs.length})`}
        className=" mt-6"
      >
        <div className="space-y-2">
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="border border-outlines rounded-2xl p-3 bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-dark truncate">
                      {job.fileName}
                    </p>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full ",
                        job.status === "COMPLETED" &&
                          "bg-success/30 text-lime-600",
                        job.status === "PROCESSING" &&
                          "bg-blue-100 text-blue-700",
                        job.status === "PENDING" &&
                          "bg-yellow-100 text-yellow-700",
                        job.status === "FAILED" && "bg-danger/20 text-red-500"
                      )}
                    >
                      {job.status === "COMPLETED" && "✓ Completado"}
                      {job.status === "PROCESSING" && "⏳ Procesando"}
                      {job.status === "PENDING" && "⏸ Pendiente"}
                      {job.status === "FAILED" && "✗ Error"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-metal">
                    <span>
                      {PARSING_MODES.find((m) => m.id === job.mode)?.label ||
                        job.mode}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span>💎</span>
                      {job.creditsUsed} créditos
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
                <span className="text-xs text-metal whitespace-nowrap">
                  {new Date(job.createdAt).toLocaleDateString("es-MX", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )}
    </>
  );
};
