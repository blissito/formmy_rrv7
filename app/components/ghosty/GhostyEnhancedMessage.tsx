/**
 * Enhanced Message Component with LlamaIndex metadata and rich sources
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "~/lib/utils";
import { useState } from 'react';
import { formatReasoningContent } from '~/utils/formatReasoningContent';
import { GhostyFollowUpSuggestions } from './GhostyFollowUpSuggestions';
import type { GhostyLlamaMessage } from './hooks/useGhostyLlamaChat';
import { BsClock, BsLightning, BsGraphUp, BsShield, BsStars } from 'react-icons/bs';

interface GhostyEnhancedMessageProps {
  message: GhostyLlamaMessage;
  onCopy?: (content: string) => void | Promise<void>;
  onRegenerate?: (messageId: string) => void | Promise<void>;
  onSuggestionClick?: (suggestion: string) => void;
  userImage?: string | null;
}

export const GhostyEnhancedMessage = ({ 
  message, 
  onCopy, 
  onRegenerate,
  onSuggestionClick,
  userImage 
}: GhostyEnhancedMessageProps) => {
  const [showCopied, setShowCopied] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

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

  // Calculate confidence color
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-blue-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Format tools for display
  const getToolDisplayName = (toolName: string) => {
    const toolNames: Record<string, string> = {
      'query_chatbots': '🤖 Chatbots',
      'get_chatbot_stats': '📊 Estadísticas',
      'web_search': '🌐 Búsqueda Web',
      'web_fetch': '📄 Contenido Web',
    };
    return toolNames[toolName] || toolName;
  };

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
            // Assistant message - markdown with enhanced features
            <div className={cn(
              "prose prose-sm md:prose-base max-w-none break-words",
              "prose-headings:text-dark prose-p:text-dark prose-strong:text-dark",
              "prose-code:text-brand-500 prose-code:bg-brand-100/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
              "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-outlines prose-pre:rounded-lg prose-pre:overflow-hidden",
              "prose-pre>code:before:content-none prose-pre>code:after:content-none",
              "prose-blockquote:border-l-2 prose-blockquote:border-l-brand-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:text-irongray",
              "prose-ul:pl-4 prose-ol:pl-4 prose-li:my-0.5",
              isStreaming && "animate-pulse"
            )}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatReasoningContent(message.content)}
              </ReactMarkdown>
              
              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-brand-500 animate-pulse ml-1" />
              )}
            </div>
          )}
        </div>

        {/* Enhanced Sources with LlamaIndex metadata */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-dark">📚 Fuentes consultadas</span>
              {message.confidence && (
                <div className="flex items-center gap-1">
                  <BsShield className={cn("text-xs", getConfidenceColor(message.confidence))} />
                  <span className={cn("text-xs font-medium", getConfidenceColor(message.confidence))}>
                    {Math.round(message.confidence * 100)}% confianza
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid gap-3">
              {message.sources.map((source, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border border-gray-200/60",
                    "bg-white/80 hover:bg-white transition-all duration-200"
                  )}
                >
                  {/* Enhanced Thumbnail with type indicator */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60 flex items-center justify-center relative">
                    {source.type === 'web' && <span className="text-lg">🌐</span>}
                    {source.type === 'chatbot' && <span className="text-lg">🤖</span>}
                    {source.type === 'stats' && <span className="text-lg">📊</span>}
                    {source.type === 'context' && <span className="text-lg">📝</span>}
                    
                    {/* Confidence indicator */}
                    {source.confidence && (
                      <div className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                        getConfidenceColor(source.confidence).replace('text-', 'bg-')
                      )} />
                    )}
                  </div>

                  {/* Enhanced Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-dark">
                        {source.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-brand-500 font-mono">
                          [{index + 1}]
                        </span>
                        {source.toolUsed && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                            {getToolDisplayName(source.toolUsed)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {source.snippet && (
                      <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                        {source.snippet}
                      </p>
                    )}
                    
                    {/* Enhanced metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-brand-500 transition-colors truncate max-w-[200px]"
                        >
                          {new URL(source.url).hostname}
                        </a>
                      )}
                      
                      {source.metadata?.processingTime && (
                        <div className="flex items-center gap-1">
                          <BsClock className="text-xs" />
                          <span>{source.metadata.processingTime}ms</span>
                        </div>
                      )}
                      
                      {source.metadata?.tokensUsed && (
                        <div className="flex items-center gap-1">
                          <BsLightning className="text-xs" />
                          <span>{source.metadata.tokensUsed} tokens</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Suggestions */}
        {!isUser && message.suggestedFollowUp && message.suggestedFollowUp.length > 0 && onSuggestionClick && (
          <GhostyFollowUpSuggestions
            suggestions={message.suggestedFollowUp}
            toolsUsed={message.toolsUsed}
            onSuggestionClick={onSuggestionClick}
          />
        )}

        {/* Enhanced Actions */}
        <div className={cn(
          "flex items-center gap-2 mt-2 opacity-100 transition-opacity duration-200",
          isUser ? "justify-end hidden" : "justify-start"
        )}>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md text-gray-500 hover:text-dark",
              "hover:bg-brand-100/40 transition-all duration-200 flex items-center gap-1",
              "border border-gray-200/60 hover:border-gray-300/80"
            )}
          >
            {showCopied ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-xs">📋</span>
            )}
            <span>{showCopied ? "Copiado" : "Copiar"}</span>
          </button>

          {/* Metadata toggle */}
          {message.metadata && (
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md text-gray-500 hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200 flex items-center gap-1",
                "border border-gray-200/60 hover:border-gray-300/80"
              )}
            >
              <BsGraphUp className="text-xs" />
              <span>Detalles</span>
            </button>
          )}

          {/* Regenerate button */}
          {!isUser && onRegenerate && !isStreaming && (
            <button
              onClick={handleRegenerate}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md text-gray-500 hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200 flex items-center gap-1",
                "border border-gray-200/60 hover:border-gray-300/80"
              )}
            >
              <span className="text-xs">🔄</span>
              <span>Regenerar</span>
            </button>
          )}
        </div>

        {/* Expandable Metadata */}
        {showMetadata && message.metadata && (
          <div className="mt-3 p-3 bg-gray-50/70 rounded-lg border border-gray-200/60">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {message.metadata.tokensUsed && (
                <div className="flex items-center gap-1">
                  <BsLightning className="text-blue-500" />
                  <span className="text-gray-600">
                    {message.metadata.tokensUsed} tokens
                  </span>
                </div>
              )}
              
              {message.metadata.processingTime && (
                <div className="flex items-center gap-1">
                  <BsClock className="text-green-500" />
                  <span className="text-gray-600">
                    {message.metadata.processingTime}ms
                  </span>
                </div>
              )}
              
              {message.metadata.model && (
                <div className="flex items-center gap-1">
                  <BsStars className="text-purple-500" />
                  <span className="text-gray-600">
                    {message.metadata.model}
                  </span>
                </div>
              )}
              
              {message.metadata.iterations && (
                <div className="flex items-center gap-1">
                  <BsGraphUp className="text-orange-500" />
                  <span className="text-gray-600">
                    {message.metadata.iterations} iteraciones
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-gray-400 mt-2 flex items-center",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
            <span>
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