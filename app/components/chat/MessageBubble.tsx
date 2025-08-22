import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "./Avatar";
import type { ReactNode } from "react";
import { useState } from "react";

// Estilos unificados para el contenido markdown con bloques de código mejorados
const PROSE_STYLES = "prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-tight prose-headings:my-1 prose-headings:font-bold prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:text-sm prose-code:bg-slate-800 prose-code:text-green-400 prose-code:dark:bg-slate-900 prose-code:dark:text-green-300 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-800 prose-pre:text-green-400 prose-pre:dark:bg-slate-900 prose-pre:dark:text-green-300 prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs prose-code:font-mono prose-pre:overflow-x-auto prose-pre:my-2 prose-pre:border prose-pre:border-slate-600 prose-blockquote:border-l-2 prose-blockquote:border-gray-200 prose-blockquote:dark:border-gray-500 prose-blockquote:pl-2 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:dark:text-gray-400 prose-blockquote:my-1 prose-strong:font-semibold prose-em:italic prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:hover:underline [&_table]:!my-0 [&_thead]:!bg-transparent [&_tbody]:!bg-transparent [&_tr]:!border-0 [&_th]:!border-0 [&_th]:!p-0 [&_td]:!border-0 [&_td]:!p-0";

interface MessageBubbleProps {
  message?: {
    role: "user" | "assistant";
    content: ReactNode;
  };
  role?: "user" | "assistant";
  children?: ReactNode;
  primaryColor?: string;
  avatarUrl?: string;
}

// Componente para el reasoning colapsable
const ReasoningSection = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-3 border-t border-dashed border-gray-300 dark:border-gray-600 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors group"
      >
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-blue-600 dark:text-blue-400">Debug Info</span>
        </div>
        <svg
          className={`w-3 h-3 transition-transform text-gray-400 group-hover:text-gray-600 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="mt-2 p-3 bg-slate-900 dark:bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-slate-400 font-medium">AI Reasoning Process</span>
          </div>
          <div className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
            <pre className="whitespace-pre-wrap">{content}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export const MessageBubble = ({
  message = { role: "assistant", content: "..." },
  children: nodes,
  primaryColor,
  avatarUrl,
}: MessageBubbleProps) => {
  if (message.role === "user" && message.content) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-dark rounded-xl p-2 max-w-xs">
          <p className="text-base text-white whitespace-pre-line leading-tight">
            {nodes || message?.content}
          </p>
        </div>
        <Avatar className="w-8 h-8" />
      </div>
    );
  }
  if (nodes) {
    return (
      <main className="px-4 flex items-start gap-3 ">
        {/* <Avatar primaryColor={primaryColor} /> */}
        <div className="bg-white border dark:bg-space-700 rounded-xl p-3 max-w-md">
          <div
            className={PROSE_STYLES}
            style={{ whiteSpace: "pre-line", lineHeight: "1" }}
          >
            {nodes}
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="px-4 flex items-start gap-3 max-w-[90%] ">
      <Avatar className="w-8 h-8" src={avatarUrl} />
      <div className="bg-white border border-outlines rounded-tr-lg rounded-xl  p-3 max-w-md ">
        <div
          className={PROSE_STYLES}
          style={{ whiteSpace: "pre-line", lineHeight: "1" }}
        >
{(() => {
            const content = String(message.content);
            
            // Extraer reasoning SIEMPRE al final, sin importar dónde aparezca
            const reasoningMatches = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/g);
            let mainContent = content;
            let allReasoning = '';
            
            if (reasoningMatches) {
              // Remover todos los bloques de reasoning del contenido principal
              mainContent = content.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim();
              
              // Combinar todo el reasoning
              allReasoning = reasoningMatches
                .map(match => match.replace(/<\/?reasoning>/g, '').trim())
                .join('\n\n---\n\n');
            }
            
            
            // Si el main content está vacío pero tenemos reasoning, mostrar mensaje por defecto
            if (!mainContent.trim() && allReasoning) {
              mainContent = 'Procesando respuesta...';
            }
            
            // Si no hay contenido principal pero sí reasoning, es probable que todo sea reasoning
            if (mainContent.trim().length < 10 && allReasoning.length > 50) {
              console.log('🔄 FIXING: Looks like everything is reasoning, extracting actual response...');
              // Intentar extraer la respuesta real del reasoning
              const responsePattern = /(?:response|answer|resultado):\s*([\s\S]*?)(?:\n|$)/i;
              const match = allReasoning.match(responsePattern);
              if (match) {
                mainContent = match[1].trim();
                console.log('✅ EXTRACTED: Found response in reasoning:', mainContent.substring(0, 100));
              }
            }
            
            const markdownComponents = {
              a: ({ children, href }: any) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
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
            };

            return (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {mainContent}
                </ReactMarkdown>
                {allReasoning && (
                  <ReasoningSection content={allReasoning} />
                )}
              </>
            );
          })()}
        </div>
      </div>
    </main>
  );
};
