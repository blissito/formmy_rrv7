/**
 * Utilidades para manejar eventos de artefactos en el chat
 *
 * Los eventos de artefactos se envían como mensajes con:
 * - text: Mensaje amigable visible para el usuario
 * - metadata: Datos estructurados del evento para el backend
 */

export interface ArtifactEventPayload {
  [key: string]: unknown;
}

// ============================================================
// LIFECYCLE TYPES
// ============================================================

export type ArtifactPhase = "interactive" | "processing" | "resolved";
export type ResolvedOutcome = "confirmed" | "cancelled" | "expired";

export interface ArtifactLifecycleState {
  phase: ArtifactPhase;
  outcome?: ResolvedOutcome;
  artifactName: string;
  resolvedData?: Record<string, unknown>;
}

// Eventos que resuelven el artefacto (transición a processing → resolved)
export const RESOLVING_EVENTS = ["onSelect", "onSubmit", "onConfirm"] as const;
// Eventos que cancelan el artefacto (transición directa a resolved:cancelled)
export const CANCELLING_EVENTS = ["onCancel", "onClose"] as const;

/**
 * Determina el outcome basado en el tipo de evento
 */
export function getOutcomeFromEvent(
  eventName: string
): ResolvedOutcome | null {
  if (RESOLVING_EVENTS.includes(eventName as typeof RESOLVING_EVENTS[number])) {
    return "confirmed";
  }
  if (CANCELLING_EVENTS.includes(eventName as typeof CANCELLING_EVENTS[number])) {
    return "cancelled";
  }
  return null; // Evento no resuelve el artefacto
}

/**
 * Verifica si un evento causa transición de fase
 */
export function isResolvingEvent(eventName: string): boolean {
  return getOutcomeFromEvent(eventName) !== null;
}

// ============================================================
// METADATA TYPES
// ============================================================

export interface ArtifactEventMetadata {
  artifactEvent: {
    name: string;
    payload: ArtifactEventPayload;
  };
  artifactLifecycle?: ArtifactLifecycleState;
}

// Prefijo especial para detectar mensajes de artefacto (invisible pero detectable)
export const ARTIFACT_MESSAGE_PREFIX = "[ARTIFACT_ACTION]";

/**
 * Genera un mensaje amigable basado en el tipo de evento
 * Incluye prefijo especial para detección
 */
export function formatArtifactEventMessage(
  eventName: string,
  payload: ArtifactEventPayload
): string {
  let message: string;

  switch (eventName) {
    case "onSelect":
      // Para date-picker y selectores
      if (payload.date && payload.time) {
        message = `He seleccionado: ${formatDate(payload.date as string)} a las ${payload.time}`;
      } else if (payload.date) {
        message = `He seleccionado: ${formatDate(payload.date as string)}`;
      } else if (payload.value) {
        message = `He seleccionado: ${payload.value}`;
      } else {
        message = `He realizado una selección`;
      }
      break;

    case "onConfirm":
    case "onSubmit":
      message = payload.data ? `He confirmado mi selección` : `He confirmado`;
      break;

    case "onCancel":
    case "onClose":
      message = `He cancelado la selección`;
      break;

    case "onViewMore":
      // Para product-card: usuario quiere ver más detalles/imágenes del producto
      if (payload.name) {
        message = `Quiero ver más imágenes y detalles de "${payload.name}"`;
      } else {
        message = `Quiero ver más imágenes y detalles de este producto`;
      }
      break;

    case "onAddToCart":
      // Para product-card: usuario quiere agregar al carrito
      if (payload.name && payload.price) {
        message = `Quiero agregar "${payload.name}" ($${payload.price} ${payload.currency || 'MXN'}) al carrito`;
      } else if (payload.name) {
        message = `Quiero agregar "${payload.name}" al carrito`;
      } else {
        message = `Quiero agregar este producto al carrito`;
      }
      break;

    case "onPay":
      // Para payment-card
      message = `Quiero proceder con el pago`;
      break;

    default:
      message = `Acción: ${eventName}`;
  }

  // Incluir prefijo + evento + payload JSON para parsing posterior
  return `${ARTIFACT_MESSAGE_PREFIX}:${eventName}:${JSON.stringify(payload)}:${message}`;
}

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Crea la metadata estructurada para el evento
 * Incluye artifactLifecycle si el evento causa una transición de fase
 */
export function createArtifactEventMetadata(
  eventName: string,
  payload: ArtifactEventPayload,
  artifactName?: string
): ArtifactEventMetadata {
  const outcome = getOutcomeFromEvent(eventName);

  const metadata: ArtifactEventMetadata = {
    artifactEvent: {
      name: eventName,
      payload,
    },
  };

  // Si el evento resuelve el artefacto, incluir lifecycle
  if (outcome && artifactName) {
    metadata.artifactLifecycle = {
      phase: "resolved",
      outcome,
      artifactName,
      resolvedData: payload as Record<string, unknown>,
    };
  }

  return metadata;
}

/**
 * Detecta si un mensaje es de evento de artefacto (nuevo o legacy)
 */
export function isArtifactEventMessage(text: string): boolean {
  return (
    text.startsWith(ARTIFACT_MESSAGE_PREFIX) ||
    text.startsWith("[ARTIFACT_EVENT:")
  );
}

/**
 * Alias para compatibilidad
 */
export function isLegacyArtifactEventMessage(text: string): boolean {
  return isArtifactEventMessage(text);
}

/**
 * Parsea un mensaje de evento de artefacto (nuevo formato o legacy)
 */
export function parseArtifactEvent(
  text: string
): { name: string; payload: ArtifactEventPayload; friendlyMessage: string } | null {
  // Nuevo formato: [ARTIFACT_ACTION]:eventName:{"payload"}:mensaje amigable
  if (text.startsWith(ARTIFACT_MESSAGE_PREFIX)) {
    const parts = text.split(":");
    if (parts.length >= 4) {
      const name = parts[1];
      try {
        // Reconstruir el JSON que puede contener ":"
        const jsonAndMessage = parts.slice(2).join(":");
        const jsonEndIndex = jsonAndMessage.indexOf("}") + 1;
        const payload = JSON.parse(jsonAndMessage.substring(0, jsonEndIndex));
        const friendlyMessage = jsonAndMessage.substring(jsonEndIndex + 1) || "";
        return { name, payload, friendlyMessage };
      } catch {
        return { name, payload: {}, friendlyMessage: "" };
      }
    }
  }

  // Legacy formato: [ARTIFACT_EVENT:eventName] {"payload"}
  const legacyMatch = text.match(/^\[ARTIFACT_EVENT:(\w+)\]\s*(.*)$/);
  if (legacyMatch) {
    try {
      return {
        name: legacyMatch[1],
        payload: legacyMatch[2] ? JSON.parse(legacyMatch[2]) : {},
        friendlyMessage: "",
      };
    } catch {
      return { name: legacyMatch[1], payload: {}, friendlyMessage: "" };
    }
  }

  return null;
}

/**
 * Alias para compatibilidad
 */
export function parseLegacyArtifactEvent(
  text: string
): { name: string; payload: ArtifactEventPayload } | null {
  const result = parseArtifactEvent(text);
  return result ? { name: result.name, payload: result.payload } : null;
}
