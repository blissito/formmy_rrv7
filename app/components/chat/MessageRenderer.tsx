/**
 * MessageRenderer - Componente unificado para renderizar mensajes de chat
 *
 * ARQUITECTURA MODERNA (2025):
 * - Usa `parts` (UIMessage format) si existen
 * - Usa Streamdown para markdown (optimizado para streaming)
 * - Detecta y renderiza artefactos con badges elegantes
 * - Compatible con mensajes legacy (content string)
 *
 * @example
 * // Con parts (nuevo formato)
 * <MessageRenderer parts={message.parts} />
 *
 * // Con content legacy
 * <MessageRenderer content={message.content} />
 *
 * // Ambos (parts tiene prioridad)
 * <MessageRenderer parts={message.parts} content={message.content} />
 */

import { Streamdown } from "streamdown";
import { ArtifactActionBubble, isArtifactActionMessage } from "./ArtifactActionBubble";
import { ArtifactRenderer } from "~/components/artifacts/ArtifactRenderer";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface MessagePart {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  args?: unknown;
  output?: {
    type?: string;
    name?: string;
    displayName?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface MessageRendererProps {
  /** UIMessage.parts - formato estándar Vercel AI SDK */
  parts?: MessagePart[] | object[];
  /** Contenido legacy (string) - fallback si no hay parts */
  content?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Variante de estilo */
  variant?: "chat" | "dashboard" | "compact";
}

// ============================================================================
// MARKDOWN COMPONENTS (Streamdown)
// ============================================================================

const markdownComponents = {
  a: ({ children, href }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      {children}
    </a>
  ),

  table: ({ children }: any) => (
    <div className="my-3 overflow-x-auto bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full border-collapse">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }: any) => (
    <thead className="bg-gray-100 dark:bg-gray-700">
      {children}
    </thead>
  ),

  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
      {children}
    </tbody>
  ),

  tr: ({ children }: any) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      {children}
    </tr>
  ),

  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
      {children}
    </th>
  ),

  td: ({ children }: any) => (
    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
      {children}
    </td>
  ),

  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
      {children}
    </blockquote>
  ),
};

// ============================================================================
// PART RENDERERS
// ============================================================================

/**
 * Renderiza una part de tipo "text" con Streamdown
 */
function TextPart({ text, className }: { text: string; className?: string }) {
  // Detectar si es un mensaje de evento de artefacto
  if (isArtifactActionMessage(text)) {
    return <ArtifactActionBubble text={text} className={className} />;
  }

  return (
    <Streamdown components={markdownComponents}>
      {text}
    </Streamdown>
  );
}

/**
 * Renderiza un badge para artefactos (tool-openArtifactTool)
 */
function ArtifactBadge({ output }: { output: MessagePart["output"] }) {
  if (!output || output.type !== "artifact") return null;

  const displayName = output.displayName || output.name || "Artefacto";

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 my-1 bg-purple-50 rounded-md border border-purple-100 text-xs text-purple-700">
      <span>🧩</span>
      <span>{displayName}</span>
    </div>
  );
}

/**
 * Renderiza un badge genérico para tools
 */
function ToolBadge({ toolName }: { toolName: string }) {
  // Nombres amigables para tools conocidos
  const friendlyNames: Record<string, { icon: string; label: string; color: string }> = {
    getContextTool: { icon: "🔍", label: "Búsqueda", color: "bg-blue-50 border-blue-100 text-blue-700" },
    saveLeadTool: { icon: "💾", label: "Lead guardado", color: "bg-green-50 border-green-100 text-green-700" },
    openArtifactTool: { icon: "🧩", label: "Artefacto", color: "bg-purple-50 border-purple-100 text-purple-700" },
  };

  const config = friendlyNames[toolName] || {
    icon: "🔧",
    label: toolName.replace(/Tool$/, ""),
    color: "bg-gray-50 border-gray-200 text-gray-600"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 my-1 rounded-md border text-xs",
      config.color
    )}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MessageRenderer({
  parts,
  content,
  className,
  variant = "chat"
}: MessageRendererProps) {
  const baseStyles = cn(
    "prose prose-sm max-w-none",
    "prose-p:my-1 prose-p:leading-relaxed",
    "prose-headings:my-2 prose-headings:font-semibold",
    "prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
    "prose-code:bg-slate-800 prose-code:text-green-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
    "prose-pre:bg-slate-800 prose-pre:text-green-400 prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs prose-pre:overflow-x-auto",
    variant === "compact" && "text-sm",
    className
  );

  // Si hay parts, usar el formato nuevo (UIMessage)
  if (parts && Array.isArray(parts) && parts.length > 0) {
    return (
      <div className={baseStyles}>
        {parts.map((part: any, idx: number) => {
          const partType = part.type as string;

          // Part de texto
          if (partType === "text" && part.text) {
            return <TextPart key={idx} text={part.text} />;
          }

          // Part de artefacto (tool-openArtifactTool)
          if (partType === "tool-openArtifactTool") {
            if (part.state === "output-available" && part.output?.type === "artifact") {
              const output = part.output as {
                name?: string;
                displayName?: string;
                code?: string;
                compiledCode?: string | null;
                data?: Record<string, unknown>;
              };

              // Renderizar artefacto completo en modo resolved (no interactivo)
              // En historial: phase="resolved" sin outcome para evitar badge innecesario
              if (output.code) {
                return (
                  <div key={idx} className="my-2">
                    <ArtifactRenderer
                      name={output.name}
                      code={output.code}
                      compiledCode={output.compiledCode}
                      data={output.data || {}}
                      phase="resolved"
                      onEvent={() => {}}
                    />
                  </div>
                );
              }

              // Fallback a badge si no hay código
              return <ArtifactBadge key={idx} output={part.output} />;
            }
            return null;
          }

          // Otras tools con output disponible
          if (partType?.startsWith("tool-") && part.state === "output-available") {
            const toolName = part.toolName || partType.replace("tool-", "");
            return <ToolBadge key={idx} toolName={toolName} />;
          }

          // Parts desconocidos - ignorar silenciosamente
          return null;
        })}
      </div>
    );
  }

  // Fallback: usar content legacy
  if (content) {
    return (
      <div className={baseStyles}>
        <TextPart text={content} />
      </div>
    );
  }

  // Sin contenido
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MessageRenderer;

// Re-export utilities para conveniencia
export { isArtifactActionMessage } from "./ArtifactActionBubble";
