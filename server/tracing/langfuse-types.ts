/**
 * Langfuse Integration Types
 *
 * Tipos compatibles con Langfuse para futura integración.
 * Basado en: https://langfuse.com/docs/observability/data-model
 *
 * @see https://api.reference.langfuse.com/
 */

// ============================================================================
// CORE TYPES (Compatible with Langfuse API)
// ============================================================================

/**
 * Trace - Represents a single request or operation
 * Maps to Formmy's Trace model
 */
export interface LangfuseTrace {
  id: string;
  name?: string;
  userId?: string;
  sessionId?: string; // Groups traces into conversations
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  tags?: string[];
  version?: string;
  release?: string;
  public?: boolean;
}

/**
 * Span - Individual step within a trace
 * Maps to Formmy's Span model
 */
export interface LangfuseSpan {
  id: string;
  traceId: string;
  parentObservationId?: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";
  statusMessage?: string;
  version?: string;
}

/**
 * Generation - LLM call observation
 * Extends Span with LLM-specific fields
 */
export interface LangfuseGeneration extends LangfuseSpan {
  model?: string;
  modelParameters?: Record<string, unknown>;
  usage?: {
    input?: number;
    output?: number;
    total?: number;
    unit?: "TOKENS" | "CHARACTERS" | "MILLISECONDS" | "SECONDS" | "IMAGES";
  };
  promptName?: string;
  promptVersion?: number;
  completionStartTime?: Date;
}

/**
 * Score - Evaluation attached to a trace or observation
 * Maps to future Formmy Score model
 */
export interface LangfuseScore {
  id?: string;
  traceId: string;
  observationId?: string;
  name: string;
  value: number | string;
  comment?: string;
  source?: "API" | "ANNOTATION" | "EVAL";
  dataType?: "NUMERIC" | "CATEGORICAL" | "BOOLEAN";
  configId?: string;
}

/**
 * Session - Groups related traces (conversations)
 * Virtual concept in Langfuse, represented by sessionId
 */
export interface LangfuseSession {
  id: string;
  traces: LangfuseTrace[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CONVERSION FUNCTIONS (Formmy -> Langfuse)
// ============================================================================

import type { Trace, Span, TraceEvent } from "@prisma/client";

/**
 * Convert Formmy Trace to Langfuse format
 */
export function toLangfuseTrace(
  trace: Trace & { chatbot?: { name: string; slug: string } | null }
): LangfuseTrace {
  const metadata = trace.metadata as Record<string, unknown> | null;

  return {
    id: trace.id,
    name: trace.chatbot?.name || "Formmy Chat",
    userId: trace.userId || undefined,
    sessionId: (metadata?.sessionId as string) || trace.conversationId || undefined,
    input: trace.input,
    output: trace.output,
    metadata: {
      chatbotId: trace.chatbotId,
      conversationId: trace.conversationId,
      model: trace.model,
      totalTokens: trace.totalTokens,
      totalCost: trace.totalCost,
      creditsUsed: trace.creditsUsed,
      durationMs: trace.durationMs,
      status: trace.status,
      ...metadata,
    },
    tags: [
      trace.status,
      trace.model || "unknown-model",
      trace.chatbot?.slug || "no-chatbot",
    ].filter(Boolean) as string[],
  };
}

/**
 * Convert Formmy Span to Langfuse format
 */
export function toLangfuseSpan(span: Span): LangfuseSpan {
  return {
    id: span.id,
    traceId: span.traceId,
    parentObservationId: span.parentSpanId || undefined,
    name: span.name,
    startTime: span.startTime,
    endTime: span.endTime || undefined,
    input: span.input,
    output: span.output,
    metadata: {
      type: span.type,
      tokens: span.tokens,
      cost: span.cost,
      credits: span.credits,
      ...(span.metadata as Record<string, unknown>),
    },
    level: span.status === "ERROR" ? "ERROR" : "DEFAULT",
    statusMessage: span.error || undefined,
  };
}

/**
 * Convert Formmy Span to Langfuse Generation (for LLM calls)
 */
export function toLangfuseGeneration(span: Span): LangfuseGeneration {
  const base = toLangfuseSpan(span);

  return {
    ...base,
    model: span.name, // En Formmy, el nombre del span LLM es el modelo
    usage: span.tokens
      ? {
          total: span.tokens,
          unit: "TOKENS",
        }
      : undefined,
  };
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

/**
 * Full trace export with all observations
 */
export interface LangfuseTraceExport {
  trace: LangfuseTrace;
  observations: (LangfuseSpan | LangfuseGeneration)[];
  scores: LangfuseScore[];
}

/**
 * Convert complete Formmy trace to Langfuse export format
 */
export function toFullLangfuseExport(
  trace: Trace & {
    chatbot?: { name: string; slug: string } | null;
    spans: Span[];
    events?: TraceEvent[];
  },
  scores?: LangfuseScore[]
): LangfuseTraceExport {
  return {
    trace: toLangfuseTrace(trace),
    observations: trace.spans.map((span) =>
      span.type === "LLM_CALL" ? toLangfuseGeneration(span) : toLangfuseSpan(span)
    ),
    scores: scores || [],
  };
}

// ============================================================================
// LANGFUSE API CLIENT (Future Implementation)
// ============================================================================

/**
 * Placeholder for Langfuse API client configuration
 * @future Implement when ready for real integration
 */
export interface LangfuseClientConfig {
  publicKey: string;
  secretKey: string;
  baseUrl?: string; // Default: https://cloud.langfuse.com
  flushAt?: number;
  flushInterval?: number;
}

/**
 * Langfuse client stub - to be implemented
 * @future Replace with actual @langfuse/langfuse-node SDK
 */
export class LangfuseExporter {
  private config: LangfuseClientConfig;

  constructor(config: LangfuseClientConfig) {
    this.config = config;
  }

  /**
   * Export a single trace to Langfuse
   * @future Implement with actual API call
   */
  async exportTrace(trace: LangfuseTraceExport): Promise<{ success: boolean; id?: string }> {
    // TODO: Implement actual Langfuse API call
    // const langfuse = new Langfuse(this.config);
    // await langfuse.trace(trace.trace);
    // for (const obs of trace.observations) { await langfuse.span(obs); }
    // for (const score of trace.scores) { await langfuse.score(score); }
    // await langfuse.flush();

    console.log("[LangfuseExporter] Would export trace:", trace.trace.id);
    return { success: true, id: trace.trace.id };
  }

  /**
   * Export multiple traces in batch
   * @future Implement with actual API call
   */
  async exportBatch(traces: LangfuseTraceExport[]): Promise<{ success: boolean; count: number }> {
    // TODO: Implement batch export
    console.log("[LangfuseExporter] Would export batch:", traces.length);
    return { success: true, count: traces.length };
  }
}
