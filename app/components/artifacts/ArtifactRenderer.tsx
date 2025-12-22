/**
 * ArtifactRenderer - Renderiza componentes React dinámicos en el chat
 *
 * Estrategia:
 * 1. Si hay compiledCode (pre-transpilado en servidor) → usar directamente
 * 2. Si solo hay code (JSX) → transpilar con Babel standalone
 *
 * SEGURIDAD (POC):
 * - El código se ejecuta con new Function() - SOLO PARA POC
 * - En producción: usar iframe sandbox o WebComponent
 * - Se valida que el código no tenga patterns peligrosos
 */

import React, { useMemo, Suspense, useState, useCallback, useEffect } from "react";
import { cn } from "~/lib/utils";
import type { ArtifactPhase, ResolvedOutcome } from "~/lib/artifact-events";
import { RESOLVING_EVENTS, CANCELLING_EVENTS, getOutcomeFromEvent } from "~/lib/artifact-events";
import { getNativeComponent, isNativeArtifact } from "~/components/native-artifacts/registry";

// Lazy load Babel solo si es necesario (ahorra ~700KB en bundle)
let Babel: typeof import("@babel/standalone") | null = null;
async function loadBabel() {
  if (!Babel) {
    Babel = await import("@babel/standalone");
  }
  return Babel;
}

// Patterns peligrosos que no se permiten en el código
const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /document\.cookie/i,
  /localStorage/i,
  /sessionStorage/i,
  /window\.open/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /import\s*\(/i,
  /require\s*\(/i,
  /__proto__/i,
  /constructor\s*\[/i,
];

interface ArtifactRendererProps {
  name?: string; // Nombre del artefacto (para detectar nativos)
  code: string;
  compiledCode?: string | null; // Código pre-transpilado del servidor
  data: Record<string, unknown>;
  onEvent: (eventName: string, payload: unknown) => void;
  className?: string;
  // Lifecycle props
  phase?: ArtifactPhase;
  outcome?: ResolvedOutcome;
  resolvedData?: Record<string, unknown>; // Datos capturados al resolver (payload de onSelect/onConfirm)
}

interface ArtifactOutput {
  type: "artifact";
  name: string;
  displayName: string;
  code: string;
  compiledCode?: string | null;
  data: Record<string, unknown>;
  events: string[];
  propsSchema?: unknown;
}

/**
 * Valida que el código no contenga patterns peligrosos
 */
function validateCode(code: string): { valid: boolean; error?: string } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: `Código contiene pattern peligroso: ${pattern.source}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Componente de error para mostrar cuando falla el artefacto
 */
const ErrorFallback = ({ error }: { error: string }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center gap-2 text-red-600 mb-2">
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span className="font-medium">Error en artefacto</span>
    </div>
    <p className="text-sm text-red-500 whitespace-pre-wrap">{error}</p>
  </div>
);

/**
 * Loading fallback mientras se carga el artefacto
 */
const LoadingFallback = () => (
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);

/**
 * Vista default para estado "processing"
 */
const DefaultProcessingView = () => (
  <div className="p-6 bg-white rounded-lg text-center">
    <div className="w-12 h-12 mx-auto mb-4 relative">
      <div className="absolute inset-0 border-4 border-brand-200 rounded-full" />
      <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin" />
    </div>
    <p className="text-gray-600 font-medium">Procesando...</p>
    <p className="text-sm text-gray-400 mt-1">Un momento por favor</p>
  </div>
);

/**
 * Vista default para estado "resolved"
 */
const DefaultResolvedView = ({
  outcome,
  resolvedData,
}: {
  outcome?: ResolvedOutcome;
  resolvedData?: Record<string, unknown>;
}) => {
  if (outcome === "confirmed") {
    return (
      <div className="p-6 bg-white rounded-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmado</h3>
        {resolvedData && Object.keys(resolvedData).length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg text-left text-sm">
            {Object.entries(resolvedData).map(([key, value]) => (
              <div key={key} className="text-green-800">
                <span className="font-medium capitalize">{key}:</span>{" "}
                {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (outcome === "cancelled") {
    return (
      <div className="p-6 bg-white rounded-lg text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelado</h3>
        <p className="text-sm text-gray-500">La acción fue cancelada</p>
      </div>
    );
  }

  // expired u otro
  return (
    <div className="p-6 bg-white rounded-lg text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Tiempo agotado</h3>
      <p className="text-sm text-gray-500">La acción expiró</p>
    </div>
  );
};

/**
 * Props disponibles para el componente del artefacto
 */
interface ArtifactComponentProps {
  data: Record<string, unknown>;
  phase: ArtifactPhase;
  outcome?: ResolvedOutcome;
  resolvedData?: Record<string, unknown>;
  onEvent: (name: string, payload: unknown) => void;
}

/**
 * Crea un componente React a partir de código JavaScript transpilado
 */
function createComponentFromCode(
  jsCode: string,
  setError: (error: string | null) => void
): React.ComponentType<ArtifactComponentProps> | null {
  // Validar código
  const validation = validateCode(jsCode);
  if (!validation.valid) {
    setError(validation.error || "Código inválido");
    return null;
  }

  try {
    // Crear scope con React y hooks disponibles
    const wrappedCode = `
      const useState = React.useState;
      const useEffect = React.useEffect;
      const useCallback = React.useCallback;
      const useMemo = React.useMemo;
      const useRef = React.useRef;

      ${jsCode}

      return typeof ArtifactComponent !== 'undefined' ? ArtifactComponent : null;
    `;

    // Crear y ejecutar la función
    const createComponent = new Function("React", wrappedCode);
    const ArtifactComponent = createComponent(React);

    if (!ArtifactComponent) {
      setError("El artefacto debe definir un componente llamado ArtifactComponent");
      return null;
    }

    if (typeof ArtifactComponent !== "function") {
      setError("ArtifactComponent debe ser una función/componente de React");
      return null;
    }

    setError(null);
    return ArtifactComponent;
  } catch (e) {
    console.error("[ArtifactRenderer] Error creating component:", e);
    setError(e instanceof Error ? e.message : "Error desconocido al crear componente");
    return null;
  }
}

/**
 * Renderizador principal de artefactos
 *
 * LIFECYCLE:
 * - Si se pasa `phase` como prop, el componente padre controla el lifecycle
 * - Si NO se pasa `phase`, el renderer maneja su propio lifecycle internamente
 */
export const ArtifactRenderer = ({
  name,
  code,
  compiledCode,
  data,
  onEvent,
  className,
  phase: externalPhase,
  outcome: externalOutcome,
  resolvedData: externalResolvedData,
}: ArtifactRendererProps) => {
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar si es un artefacto nativo (componente React real)
  const NativeComponent = name ? getNativeComponent(name) : null;
  console.log("[ArtifactRenderer] Init:", { name, hasNativeComponent: !!NativeComponent, hasCode: !!code, hasData: !!data, dataKeys: Object.keys(data || {}) });

  // Estado interno del lifecycle (usado cuando no hay phase externo)
  const [internalPhase, setInternalPhase] = useState<ArtifactPhase>("interactive");
  const [internalOutcome, setInternalOutcome] = useState<ResolvedOutcome | undefined>();
  const [internalResolvedData, setInternalResolvedData] = useState<Record<string, unknown> | undefined>();

  // Usar phase externo si está definido, sino usar interno
  const isControlled = externalPhase !== undefined;
  const phase = isControlled ? externalPhase : internalPhase;
  const outcome = isControlled ? externalOutcome : internalOutcome;
  const resolvedData = isControlled ? externalResolvedData : internalResolvedData;

  // Crear componente al montar o cuando cambia el código
  useEffect(() => {
    async function initComponent() {
      setIsLoading(true);
      setError(null);
      setRenderError(null);

      // Usar código pre-transpilado si está disponible
      let jsCode = compiledCode;

      if (!jsCode) {
        // Fallback: transpilar en cliente con Babel
        console.log("[ArtifactRenderer] No compiledCode, using Babel fallback");
        try {
          const babel = await loadBabel();
          const result = babel.transform(code, {
            presets: ["react"],
            plugins: [],
          });
          jsCode = result.code;
        } catch (e) {
          console.error("[ArtifactRenderer] Babel transform error:", e);
          setError(e instanceof Error ? e.message : "Error de transpilación");
          setIsLoading(false);
          return;
        }
      }

      if (!jsCode) {
        setError("No se pudo obtener código ejecutable");
        setIsLoading(false);
        return;
      }

      const comp = createComponentFromCode(jsCode, setError);
      setComponent(() => comp);
      setIsLoading(false);
    }

    initComponent();
  }, [code, compiledCode]);

  // Handler de eventos wrapper con logging y lifecycle interno
  const handleEvent = useCallback(
    (eventName: string, payload: unknown) => {
      if (phase !== "interactive") {
        console.log(`[Artifact Event BLOCKED - phase: ${phase}] ${eventName}:`, payload);
        return;
      }
      console.log(`[Artifact Event] ${eventName}:`, payload);

      // Si NO es controlado, manejar lifecycle internamente
      if (!isControlled) {
        const eventOutcome = getOutcomeFromEvent(eventName);

        if (RESOLVING_EVENTS.includes(eventName as typeof RESOLVING_EVENTS[number])) {
          console.log(`[ArtifactRenderer] Transición interna a resolved:${eventOutcome}`);
          setInternalPhase("resolved");
          setInternalOutcome(eventOutcome ?? "confirmed");
          setInternalResolvedData(payload as Record<string, unknown>);
        }

        if (CANCELLING_EVENTS.includes(eventName as typeof CANCELLING_EVENTS[number])) {
          console.log(`[ArtifactRenderer] Transición interna a resolved:cancelled`);
          setInternalPhase("resolved");
          setInternalOutcome("cancelled");
        }
      }

      // Siempre propagar el evento al padre
      onEvent(eventName, payload);
    },
    [onEvent, phase, isControlled]
  );

  // Reset render error cuando cambia el código
  useEffect(() => {
    setRenderError(null);
    setRenderKey((k) => k + 1);
  }, [code, compiledCode]);

  // ============================================================
  // NATIVE COMPONENT RENDERING (Fast path)
  // ============================================================
  // Si es un artefacto nativo, usar el componente React real directamente
  // NO pasa por new Function() - es más seguro y rápido
  if (NativeComponent) {
    // PROCESSING
    if (phase === "processing") {
      return (
        <div className={cn("artifact-container border rounded-lg bg-white shadow-sm overflow-hidden", className)}>
          <DefaultProcessingView />
        </div>
      );
    }

    // RESOLVED
    if (phase === "resolved") {
      return (
        <div className={cn("artifact-container border rounded-lg bg-white shadow-sm overflow-hidden", className)}>
          <DefaultResolvedView outcome={outcome} resolvedData={resolvedData ?? data} />
        </div>
      );
    }

    // INTERACTIVE: Renderizar componente nativo real
    console.log(`[ArtifactRenderer] Rendering native: ${name}`, { data, phase, outcome });
    return (
      <div className={cn("artifact-container border rounded-lg bg-white shadow-sm overflow-hidden", className)}>
        <ErrorBoundary
          onError={(e) => setRenderError(e.message)}
          fallback={<ErrorFallback error={renderError || "Error al renderizar"} />}
        >
          <NativeComponent
            data={data}
            onEvent={handleEvent}
            phase={phase}
            outcome={outcome}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // ============================================================
  // DYNAMIC COMPONENT RENDERING (new Function path)
  // ============================================================

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (error || renderError) {
    return <ErrorFallback error={error || renderError || "Error desconocido"} />;
  }

  if (!Component) {
    return <LoadingFallback />;
  }

  // ============================================================
  // PHASE-AWARE RENDERING
  // ============================================================
  //
  // Estrategia:
  // - INTERACTIVE: Renderizar componente del developer
  // - PROCESSING: Mostrar vista del sistema (spinner) + componente colapsado
  // - RESOLVED: Mostrar vista del sistema (resultado) + componente colapsado
  //
  // Esto garantiza que el usuario SIEMPRE vea feedback visual de que algo pasó,
  // sin depender de que el artefacto implemente vistas custom.
  //
  // El componente del developer recibe todas las props (phase, outcome, resolvedData)
  // por si quiere implementar vistas custom en el futuro.

  // PROCESSING: Mostrar spinner del sistema
  if (phase === "processing") {
    return (
      <div
        className={cn(
          "artifact-container border rounded-lg bg-white shadow-sm overflow-hidden",
          className
        )}
      >
        <DefaultProcessingView />
      </div>
    );
  }

  // RESOLVED: Mostrar resultado del sistema
  if (phase === "resolved") {
    return (
      <div
        className={cn(
          "artifact-container border rounded-lg bg-white shadow-sm overflow-hidden",
          className
        )}
      >
        <DefaultResolvedView outcome={outcome} resolvedData={resolvedData ?? data} />
      </div>
    );
  }

  // INTERACTIVE: Renderizar componente del developer
  return (
    <div
      className={cn(
        "artifact-container border rounded-lg bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      <ErrorBoundary
        onError={(e) => setRenderError(e.message)}
        fallback={<ErrorFallback error={renderError || "Error al renderizar"} />}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Component
            key={renderKey}
            data={data}
            phase={phase}
            outcome={outcome}
            resolvedData={resolvedData}
            onEvent={handleEvent}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

/**
 * Error Boundary para capturar errores de render
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ArtifactRenderer] Render error:", error);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Componente wrapper para renderizar artefactos desde tool output
 */
export const ArtifactFromToolOutput = ({
  output,
  onEvent,
  className,
}: {
  output: ArtifactOutput;
  onEvent: (eventName: string, payload: unknown) => void;
  className?: string;
}) => {
  if (output.type !== "artifact") {
    return null;
  }

  return (
    <div className={className}>
      {/* Header del artefacto */}
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
        <span>🧩</span>
        <span>{output.displayName}</span>
      </div>

      {/* Renderizar artefacto */}
      <ArtifactRenderer
        name={output.name}
        code={output.code}
        compiledCode={output.compiledCode}
        data={output.data}
        onEvent={onEvent}
      />
    </div>
  );
};

export default ArtifactRenderer;

// Exportar vistas default y tipos para que artefactos puedan usarlos
export {
  DefaultProcessingView,
  DefaultResolvedView,
  type ArtifactComponentProps,
};
