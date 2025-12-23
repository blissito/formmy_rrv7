/**
 * ArtifactActionBubble - Renderiza acciones de artefacto de forma elegante
 *
 * En lugar de mostrar "[ARTIFACT_ACTION]:onSelect:{...}:mensaje"
 * muestra un badge elegante con la acción tomada.
 */

import { cn } from "~/lib/utils";
import { HiCheck, HiX, HiClock } from "react-icons/hi";
import {
  isArtifactEventMessage,
  parseArtifactEvent,
} from "~/lib/artifact-events";

interface ArtifactActionBubbleProps {
  text: string;
  className?: string;
}

/**
 * Obtiene el ícono y estilo según el tipo de evento
 */
function getEventStyle(eventName: string) {
  switch (eventName) {
    case "onSelect":
    case "onConfirm":
    case "onSubmit":
      return {
        icon: HiCheck,
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        label: "Selección confirmada",
      };
    case "onCancel":
    case "onClose":
      return {
        icon: HiX,
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        borderColor: "border-gray-200",
        label: "Acción cancelada",
      };
    case "onAddToCart":
      return {
        icon: HiCheck,
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        label: "Agregado al carrito",
      };
    case "onViewMore":
      return {
        icon: HiCheck,
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        label: "Solicitó más información",
      };
    case "onPay":
      return {
        icon: HiCheck,
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        label: "Proceder al pago",
      };
    default:
      return {
        icon: HiClock,
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        label: "Acción realizada",
      };
  }
}

/**
 * Formatea el payload para mostrar información relevante en formato MX
 */
function formatPayloadSummary(
  eventName: string,
  payload: Record<string, unknown>
): string | null {
  if (eventName === "onSelect" && payload.date) {
    const dateStr = payload.date as string;
    const time = payload.time as string | undefined;

    // Formatear fecha en español MX
    try {
      const date = new Date(dateStr + "T12:00:00"); // Evitar problemas de timezone
      const formatted = date.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      // Capitalizar primera letra
      const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      return time ? `${capitalized} a las ${time}` : capitalized;
    } catch {
      return time ? `${dateStr} a las ${time}` : dateStr;
    }
  }
  return null;
}

export function ArtifactActionBubble({
  text,
  className,
}: ArtifactActionBubbleProps) {
  // Parsear el evento
  const parsed = parseArtifactEvent(text);

  if (!parsed) {
    // Si no se puede parsear, mostrar como texto normal
    return <span className={className}>{text}</span>;
  }

  const { name, payload } = parsed;
  const style = getEventStyle(name);
  const Icon = style.icon;
  const summary = formatPayloadSummary(name, payload);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl border",
        style.bgColor,
        style.textColor,
        style.borderColor,
        "text-sm font-medium",
        "shadow-sm",
        className
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{style.label}</span>
      {summary && (
        <>
          <span className="opacity-40">•</span>
          <span className="font-normal opacity-90">{summary}</span>
        </>
      )}
    </div>
  );
}

/**
 * Detecta si un texto es un mensaje de evento de artefacto
 */
export function isArtifactActionMessage(text: string): boolean {
  return isArtifactEventMessage(text);
}

export default ArtifactActionBubble;
