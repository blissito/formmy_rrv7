import type { UIMessage } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ArtifactPhase,
  ResolvedOutcome,
} from "~/lib/artifact-events";

// Tipo para el output del artifact tool
export interface ArtifactOutput {
  type: "artifact";
  name: string;
  displayName: string;
  code: string;
  compiledCode?: string | null; // Código pre-transpilado del servidor
  data: Record<string, unknown>;
  events: string[];
  propsSchema?: unknown;
}

// Timeout para transición automática processing → resolved
// Reducido a 2s ya que ahora la transición es más directa
const PROCESSING_TIMEOUT_MS = 2000;

type ContextValue = {
  // Artifact display
  showArtifact: boolean;
  setShowArtifact: React.Dispatch<React.SetStateAction<boolean>>;
  artifactData: ArtifactOutput | null;
  setArtifactData: React.Dispatch<React.SetStateAction<ArtifactOutput | null>>;

  // Lifecycle state
  phase: ArtifactPhase;
  outcome: ResolvedOutcome | undefined;
  resolvedData: Record<string, unknown> | undefined;

  // Lifecycle methods
  transitionTo: (
    phase: ArtifactPhase,
    outcome?: ResolvedOutcome,
    data?: Record<string, unknown>
  ) => void;
  resetLifecycle: () => void;
};

export const ArtifactContext = createContext<ContextValue>({} as ContextValue);

export const ArtifactProvider = ({ children }: { children: ReactNode }) => {
  // Artifact display state
  const [showArtifact, setShowArtifact] = useState(false);
  const [artifactData, setArtifactData] = useState<ArtifactOutput | null>(null);

  // Lifecycle state
  const [phase, setPhase] = useState<ArtifactPhase>("interactive");
  const [outcome, setOutcome] = useState<ResolvedOutcome | undefined>();
  const [resolvedData, setResolvedData] = useState<
    Record<string, unknown> | undefined
  >();

  // Ref para el timeout de processing
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Transición de fase
  const transitionTo = useCallback(
    (
      newPhase: ArtifactPhase,
      newOutcome?: ResolvedOutcome,
      data?: Record<string, unknown>
    ) => {
      // Limpiar timeout anterior si existe
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      setPhase(newPhase);

      if (newOutcome !== undefined) {
        setOutcome(newOutcome);
      }

      if (data !== undefined) {
        setResolvedData(data);
      }

      // Si entramos en processing, configurar timeout para auto-resolve
      if (newPhase === "processing") {
        processingTimeoutRef.current = setTimeout(() => {
          setPhase("resolved");
          // Si no hay outcome definido, asumir confirmed
          setOutcome((prev) => prev ?? "confirmed");
        }, PROCESSING_TIMEOUT_MS);
      }
    },
    []
  );

  // Reset del lifecycle (cuando se abre un nuevo artefacto)
  const resetLifecycle = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    setPhase("interactive");
    setOutcome(undefined);
    setResolvedData(undefined);
  }, []);

  // Reset lifecycle cuando cambia el artefacto
  useEffect(() => {
    if (artifactData) {
      resetLifecycle();
    }
  }, [artifactData?.name, resetLifecycle]);

  const value: ContextValue = {
    showArtifact,
    setShowArtifact,
    artifactData,
    setArtifactData,
    phase,
    outcome,
    resolvedData,
    transitionTo,
    resetLifecycle,
  };

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};

/**
 * Hook para detectar artefactos en mensajes y manejar su ciclo de vida
 */
export const useArtifact = ({ messages }: { messages: UIMessage[] }) => {
  const {
    showArtifact,
    setShowArtifact,
    artifactData,
    setArtifactData,
    phase,
    outcome,
    resolvedData,
    transitionTo,
    resetLifecycle,
  } = useContext<ContextValue>(ArtifactContext);

  // Buscar el tool openArtifactTool en los mensajes
  const findArtifactTool = useCallback((): ArtifactOutput | null => {
    // Buscar de atrás hacia adelante para obtener el artefacto más reciente
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      for (const part of message.parts) {
        // Verificar si es un tool-openArtifactTool con output disponible
        if (
          part.type === "tool-openArtifactTool" &&
          "state" in part &&
          part.state === "output-available" &&
          "output" in part
        ) {
          const output = part.output as Record<string, unknown>;
          if (output?.type === "artifact") {
            return output as unknown as ArtifactOutput;
          }
        }
      }
    }
    return null;
  }, [messages]);

  // Detectar artefacto en mensajes
  // IMPORTANTE: Ignorar nuevos openArtifactTool si el artefacto actual ya está
  // en processing/resolved (el agente puede re-llamar después de la confirmación)
  useEffect(() => {
    const foundArtifact = findArtifactTool();
    if (foundArtifact) {
      const isSameArtifact = artifactData?.name === foundArtifact.name;
      const isArtifactInUse = phase === "processing" || phase === "resolved";

      // Si es el mismo artefacto y ya está en uso, NO hacer nada
      // Esto previene que el agente "re-abra" el artefacto después de confirmación
      if (isSameArtifact && isArtifactInUse) {
        console.log(`[useArtifact] Ignorando openArtifactTool - artefacto "${foundArtifact.name}" ya en fase "${phase}"`);
        return;
      }

      // Si es un artefacto diferente O es el mismo pero estaba en interactive
      if (!isSameArtifact) {
        console.log(`[useArtifact] Abriendo nuevo artefacto: ${foundArtifact.name}`);
        setArtifactData(foundArtifact);
        setShowArtifact(true);
        // El resetLifecycle se ejecutará por el efecto que escucha artifactData?.name
      }
    }
  }, [messages, findArtifactTool, artifactData?.name, phase, setArtifactData, setShowArtifact]);

  return {
    showArtifact,
    setShowArtifact,
    artifactData,
    phase,
    outcome,
    resolvedData,
    transitionTo,
    resetLifecycle,
  };
};
