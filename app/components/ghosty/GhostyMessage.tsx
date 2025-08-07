import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "~/lib/utils";
import type { GhostyMessage } from './hooks/useGhostyChat';
import { useState } from 'react';

interface GhostyMessageProps {
  message: GhostyMessage;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  userImage?: string; // URL de la imagen del usuario
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
    <div className={cn(
      "flex w-full gap-3 mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar */}
      {!isUser && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          "bg-brand-500 text-clear text-sm font-medium mt-1"
        )}>
          <img src="/home/ghosty-avatar.svg" alt="ghosty" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] group relative",
        isUser && "order-first"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "rounded-xl px-4 py-2 relative",
          isUser ? 
            "bg-brand-500 text-clear" : 
            "bg-[#FCFDFE] border border-outlines text-dark"
        )}>
          {isUser ? (
            // User message - plain text
            <p className="text-sm md:text-base leading-relaxed">
              {message.content}
            </p>
          ) : (
            // Assistant message - markdown
            <div className={cn(
              "prose prose-sm md:prose-base max-w-none",
              "prose-headings:text-dark prose-p:text-dark prose-strong:text-dark",
              "prose-code:text-brand-500 prose-code:bg-brand-100/20 prose-code:px-1 prose-code:rounded",
              "prose-pre:bg-gray-900 prose-pre:border prose-pre:border-outlines",
              "prose-blockquote:border-l-brand-500 prose-blockquote:text-irongray",
              "prose-table:border-collapse prose-table:border prose-table:border-outlines prose-table:w-full prose-table:my-4",
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
                      return (
                        <div className="relative">
                          <pre className={cn(
                            "bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",
                            "border border-gray-700"
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
                {message.content}
              </ReactMarkdown>
              
              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-brand-500 animate-pulse ml-1" />
              )}
            </div>
          )}
          
          {/* Sources */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-outlines/50">
              <p className="text-xs font-semibold text-irongray mb-2">📚 Fuentes consultadas:</p>
              <div className="space-y-1">
                {message.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-brand-500 hover:text-brand-600 hover:underline"
                  >
                    [{index + 1}] {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-2 mt-1 opacity-100 transition-opacity duration-200",
          isUser ? "justify-end hidden" : "justify-start"
        )}>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "text-xs px-2 py-1 rounded text-irongray hover:text-dark",
              "hover:bg-brand-100/40 transition-all duration-200"
            )}
          >
            {showCopied ? "✓ Copiado" : "Copiar"}
          </button>

          {/* Regenerate button (only for assistant) */}
          {!isUser && onRegenerate && !isStreaming && (
            <button
              onClick={handleRegenerate}
              className={cn(
                "text-xs px-2 py-1 rounded text-irongray hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200"
              )}
            >
              ↻ Regenerar
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-lightgray mt-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className={cn(
          "!w-8 !h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-outlines",
          "bg-irongray text-clear text-sm font-medium mt-1"
        )}>
          {userImage ? (
            <img 
              src={userImage} 
              alt="User" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>👤</span>
          )}
        </div>
      )}
    </div>
  );
};