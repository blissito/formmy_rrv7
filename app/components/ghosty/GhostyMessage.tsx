import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "~/lib/utils";
import type { GhostyMessage } from './hooks/useGhostyChat';
import { useState } from 'react';
import { formatReasoningContent } from '~/utils/formatReasoningContent';

interface GhostyMessageProps {
  message: GhostyMessage;
  onCopy?: (content: string) => void | Promise<void>;
  onRegenerate?: (messageId: string) => void | Promise<void>;
  userImage?: string | null; // URL de la imagen del usuario
}

export const GhostyMessageComponent = ({ 
  message, 
  onCopy, 
  onRegenerate,
  userImage 
}: GhostyMessageProps) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      await navigator.clipboard.writeText(message.content);
    }
    
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div 
      className={cn(
        "flex w-full gap-3 mb-4 px-2 sm:px-4 py-1",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          "bg-brand-500 text-clear text-sm font-medium mt-1"
        )}>
          <img src="/home/ghosty-avatar.svg" alt="ghosty" className="w-5 h-5" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[calc(100%-3rem)] sm:max-w-[80%] group relative",
        isUser && "order-first"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "rounded-xl px-4 py-2 relative shadow-sm",
          isUser 
            ? "bg-brand-500 text-clear" 
            : "bg-[#FCFDFE] border border-outlines text-dark"
        )}>
          {isUser ? (
            // User message - plain text
            <p className="text-sm md:text-base leading-relaxed break-words">
              {message.content}
            </p>
          ) : (
            // Assistant message - markdown
            <div className={cn(
              "prose prose-sm md:prose-base max-w-none break-words",
              "prose-headings:text-dark prose-p:text-dark prose-strong:text-dark",
              "prose-code:text-brand-500 prose-code:bg-brand-100/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
              "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-outlines prose-pre:rounded-lg prose-pre:overflow-hidden",
              "prose-pre>code:before:content-none prose-pre>code:after:content-none", // Remove backticks from code blocks
              "prose-blockquote:border-l-2 prose-blockquote:border-l-brand-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:text-irongray",
              "prose-ul:pl-4 prose-ol:pl-4 prose-li:my-0.5",
              "prose-table:border-collapse prose-table:border prose-table:border-outlines prose-table:w-full prose-table:my-4 prose-table:text-sm",
              "prose-th:border prose-th:border-outlines prose-th:bg-brand-100/20 prose-th:p-3 prose-th:text-dark prose-th:font-semibold prose-th:text-left",
              "prose-td:border prose-td:border-outlines prose-td:p-3 prose-td:text-dark prose-td:align-top",
              "prose-tr:even:bg-brand-50/30",
              isStreaming && "animate-pulse"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                      // Estilo especial para bloques de pensamiento
                      const isThinking = match[1] === 'thinking';
                      return (
                        <div className="relative">
                          <pre className={cn(
                            isThinking 
                              ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-900 p-4 rounded-lg overflow-x-auto border-2 border-purple-200 italic"
                              : "bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-700"
                          )}>
                            <code className={className} {...props}>
                              {String(children).replace(/\n$/, '')}
                            </code>
                          </pre>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(children))}
                            className={cn(
                              "absolute top-2 right-2 px-2 py-1 text-xs",
                              "bg-gray-700 text-gray-300 rounded opacity-0 group-hover:opacity-100",
                              "hover:bg-gray-600 transition-all duration-200"
                            )}
                          >
                            Copy
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <code className={cn(className, "bg-brand-100/20 px-1 rounded text-brand-500")} {...props}>
                          {children}
                        </code>
                      );
                    }
                  },
                }}
              >
                {formatReasoningContent(message.content)}
              </ReactMarkdown>
              
              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-brand-500 animate-pulse ml-1" />
              )}
            </div>
          )}
          
          {/* Sources */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-outlines/50">
              <p className="text-sm font-semibold text-dark mb-3">📚 Fuentes consultadas</p>
              <div className="grid gap-3">
                {message.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border border-outlines/30",
                      "hover:border-brand-300 hover:bg-brand-50/30 transition-all duration-200",
                      "group"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-outlines/30 flex items-center justify-center relative">
                      {/* Prioridad 1: Open Graph Image (thumbnail principal) */}
                      {source.image ? (
                        <>
                          <img
                            src={source.image}
                            alt={source.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const container = target.parentElement!;
                              // Si falla la OG image, mostrar favicon + sitio
                              container.innerHTML = `
                                <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                                  ${source.favicon ? `
                                    <img 
                                      src="${source.favicon}" 
                                      alt="favicon" 
                                      class="w-6 h-6 mb-1"
                                      onerror="this.style.display='none'"
                                    />
                                  ` : ''}
                                  <div class="text-xs font-bold">
                                    ${source.siteName?.charAt(0)?.toUpperCase() || '🌐'}
                                  </div>
                                </div>
                              `;
                            }}
                          />
                          {/* Favicon pequeño como overlay si hay OG image */}
                          {source.favicon && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl-sm border-l border-t border-outlines/30 flex items-center justify-center">
                              <img
                                src={source.favicon}
                                alt="favicon"
                                className="w-3 h-3"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        /* Sin OG image: Mostrar favicon más pequeño */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          {source.favicon ? (
                            <img
                              src={source.favicon}
                              alt="favicon"
                              className="w-6 h-6 mb-1"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.parentElement!.innerHTML = `
                                  <div class="w-8 h-8 rounded-full bg-brand-500 text-white text-sm flex items-center justify-center font-bold">
                                    ${source.siteName?.charAt(0)?.toUpperCase() || '🌐'}
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-500 text-white text-sm flex items-center justify-center font-bold">
                              {source.siteName?.charAt(0)?.toUpperCase() || '🌐'}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 font-medium text-center px-1 leading-tight">
                            {source.siteName || 'Web'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-dark group-hover:text-brand-600 transition-colors overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const
                        }}>
                          {source.title}
                        </h4>
                        <span className="text-xs text-brand-500 font-mono flex-shrink-0">
                          [{index + 1}]
                        </span>
                      </div>
                      
                      {source.snippet && (
                        <p className="text-xs text-irongray mb-2 leading-relaxed overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const
                        }}>
                          {source.snippet}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-lightgray">
                        <span className="truncate">
                          {source.siteName || new URL(source.url).hostname}
                        </span>
                        {source.publishedTime && (
                          <>
                            <span>•</span>
                            <time className="flex-shrink-0">
                              {new Date(source.publishedTime).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </time>
                          </>
                        )}
                      </div>

                      {/* Gallery de imágenes relacionadas */}
                      {source.images && source.images.length > 0 && (
                        <div className="mt-3">
                          <div className="flex gap-1 overflow-x-auto pb-1">
                            {source.images.slice(0, 4).map((imageUrl, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="flex-shrink-0 w-16 h-12 rounded border border-outlines/20 overflow-hidden bg-gray-100"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Related ${imgIndex + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.parentElement!.style.display = 'none';
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Abrir imagen en nueva ventana
                                    window.open(imageUrl, '_blank');
                                  }}
                                />
                              </div>
                            ))}
                            {source.images.length > 4 && (
                              <div className="flex-shrink-0 w-16 h-12 rounded border border-outlines/20 bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium">
                                +{source.images.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-2 mt-1.5 opacity-100 transition-opacity duration-200",
          isUser ? "justify-end hidden" : "justify-start"
        )}>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md text-irongray hover:text-dark",
              "hover:bg-brand-100/40 transition-all duration-200 flex items-center gap-1",
              "border border-outlines/50 hover:border-outlines/70"
            )}
            aria-label={showCopied ? "Copiado" : "Copiar al portapapeles"}
          >
            {showCopied ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-xs">📋</span>
            )}
            <span>{showCopied ? "Copiado" : "Copiar"}</span>
          </button>

          {/* Regenerate button (only for assistant) */}
          {!isUser && onRegenerate && !isStreaming && (
            <button
              onClick={handleRegenerate}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md text-irongray hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200 flex items-center gap-1",
                "border border-outlines/50 hover:border-outlines/70"
              )}
              aria-label="Regenerar respuesta"
            >
              <span className="text-xs">🔄</span>
              <span>Regenerar</span>
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-lightgray mt-1.5 flex items-center",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
            <span className="text-xs">
              {message.timestamp.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </span>
          </span>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className={cn(
          "w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
          "border-2 border-white shadow-sm",
          "bg-gradient-to-br from-brand-400 to-brand-600 text-white"
        )}>
          {userImage ? (
            <img 
              src={userImage} 
              alt="User" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = '';
                target.onerror = null;
                target.parentElement!.innerHTML = '👤';
              }}
            />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
      )}
    </div>
  );
};