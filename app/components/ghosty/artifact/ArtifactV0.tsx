import { cn } from "~/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import type { UIMessage } from "ai";

import { IoCloseCircleOutline } from "react-icons/io5";
import { useContext, useCallback } from "react";
import { ArtifactContext, useArtifact } from "~/hooks/useArtifact";
import { RiSplitCellsHorizontal } from "react-icons/ri";
import { HiOutlinePuzzle } from "react-icons/hi";
import { ArtifactRenderer } from "~/components/artifacts/ArtifactRenderer";
import {
  RESOLVING_EVENTS,
  CANCELLING_EVENTS,
  getOutcomeFromEvent,
} from "~/lib/artifact-events";

export const Artifact = ({
  messages,
  onArtifactEvent
}: {
  messages: UIMessage[];
  onArtifactEvent?: (eventName: string, payload: unknown, artifactName?: string) => void;
}) => {
  const {
    showArtifact,
    setShowArtifact,
    artifactData,
    phase,
    outcome,
    resolvedData,
    transitionTo,
  } = useArtifact({ messages });

  // Handler para eventos del artefacto con lifecycle transitions
  // SIMPLIFICADO: Vamos directo a "resolved" para dar feedback inmediato
  const handleArtifactEvent = useCallback((eventName: string, payload: unknown) => {
    console.log(`[Artifact Event] ${eventName}:`, payload);

    const eventOutcome = getOutcomeFromEvent(eventName);

    // Eventos de confirmación: interactive → resolved:confirmed (DIRECTO)
    // Esto evita depender de metadata o timeouts
    if (RESOLVING_EVENTS.includes(eventName as typeof RESOLVING_EVENTS[number])) {
      transitionTo("resolved", eventOutcome ?? "confirmed", payload as Record<string, unknown>);
    }

    // Eventos de cancelación: interactive → resolved:cancelled (directo)
    if (CANCELLING_EVENTS.includes(eventName as typeof CANCELLING_EVENTS[number])) {
      transitionTo("resolved", "cancelled");
    }

    // Propagar al handler externo (esto envía el mensaje al agente)
    if (onArtifactEvent) {
      onArtifactEvent(eventName, payload, artifactData?.name);
    }
  }, [onArtifactEvent, transitionTo, artifactData?.name]);

  return (
    <AnimatePresence>
      {showArtifact && artifactData ? (
        <motion.article
          layout
          transition={{ type: "spring", bounce: 0 }}
          initial={{ width: "0%", x: "100vw" }}
          animate={{ width: "100%", x: 0 }}
          exit={{ width: "0%", x: "100vw" }}
          className={cn(
            "flex-2 w-full bg-white r-rounded-4xl overflow-hidden",
            "border-l-4 border-l-brand-500",
            "relative",
            "flex flex-col"
          )}
        >
          {/* Header */}
          <header className="p-4 bg-brand-500 flex items-center gap-3 text-white">
            <button
              onClick={() => setShowArtifact(false)}
              className="text-2xl p-1 hover:bg-white/20 rounded-lg active:scale-95 transition-all"
            >
              <IoCloseCircleOutline />
            </button>
            <HiOutlinePuzzle className="w-5 h-5" />
            <h2 className="font-semibold text-lg">{artifactData.displayName}</h2>
            {/* Badge de fase */}
            {phase !== "interactive" && (
              <span className={cn(
                "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                phase === "processing" && "bg-yellow-400 text-yellow-900",
                phase === "resolved" && outcome === "confirmed" && "bg-green-400 text-green-900",
                phase === "resolved" && outcome === "cancelled" && "bg-gray-300 text-gray-700",
              )}>
                {phase === "processing" && "Procesando..."}
                {phase === "resolved" && outcome === "confirmed" && "Confirmado"}
                {phase === "resolved" && outcome === "cancelled" && "Cancelado"}
              </span>
            )}
          </header>

          {/* Content - Renderiza el componente del artefacto */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <ArtifactRenderer
              code={artifactData.code}
              compiledCode={artifactData.compiledCode}
              data={artifactData?.data ?? {}}
              onEvent={handleArtifactEvent}
              phase={phase}
              outcome={outcome}
              resolvedData={resolvedData}
            />
          </div>
        </motion.article>
      ) : null}
    </AnimatePresence>
  );
};

export const ArtifactInline = ({ displayName }: { displayName?: string }) => {
  const { setShowArtifact, artifactData } = useContext(ArtifactContext);

  const name = displayName || artifactData?.displayName || "Artefacto";

  return (
    <button
      onClick={() => setShowArtifact(true)}
      className={cn(
        "px-4 py-2 bg-brand-500 rounded-xl",
        "text-white text-sm font-medium",
        "flex gap-2 items-center",
        "hover:bg-brand-600 active:scale-95 transition-all"
      )}
    >
      <HiOutlinePuzzle className="w-4 h-4" />
      <span>{name}</span>
      <RiSplitCellsHorizontal className="w-4 h-4" />
    </button>
  );
};
