/**
 * Enhanced Ghosty Interface with LlamaIndex integration
 * 
 * This is the main interface that showcases all LlamaIndex improvements:
 * - Rich state management with tool progress
 * - Enhanced metadata display  
 * - Smart follow-up suggestions
 * - Real-time progress indicators
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";
import { GhostyEnhancedMessage } from "./GhostyEnhancedMessage";
import { GhostyProgressIndicator } from "./GhostyProgressIndicator";
import { useGhostyLlamaChat } from './hooks/useGhostyLlamaChat';
import type { GhostyLlamaMessage, GhostyLlamaState } from './hooks/useGhostyLlamaChat';
import { BsStars, BsLightning, BsGraphUp, BsGear } from "react-icons/bs";

interface GhostyEnhancedInterfaceProps {
  onCollapseChat: () => void;
  onExportChat?: () => void;
  userImage?: string;
  initialMode?: 'local' | 'remote';
}

export const GhostyEnhancedInterface = ({
  onCollapseChat,
  onExportChat,
  userImage,
  initialMode = 'remote'
}: GhostyEnhancedInterfaceProps) => {
  const {
    messages,
    currentState,
    isExpanded,
    error,
    toolProgress,
    currentThought,
    sendMessage,
    clearChat,
    regenerateResponse,
    getToolDisplayName,
    getStateDisplayMessage,
  } = useGhostyLlamaChat();

  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [agentMode, setAgentMode] = useState<'local' | 'remote'>(initialMode);
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-send suggestion or let user edit
    sendMessage(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      onCollapseChat();
    }
  };

  const isProcessing = ['thinking', 'tool-analyzing', 'tool-chatbots', 'tool-stats', 
                      'tool-web-search', 'tool-web-fetch', 'synthesizing', 'streaming']
                      .includes(currentState);
  
  const hasMessages = messages.length > 0;
  
  // Calculate session stats
  const sessionStats = {
    totalMessages: messages.length,
    toolsExecuted: messages.reduce((acc, msg) => acc + (msg.toolsUsed?.length || 0), 0),
    totalTokens: messages.reduce((acc, msg) => acc + (msg.metadata?.tokensUsed || 0), 0),
    averageResponseTime: messages
      .filter(msg => msg.metadata?.processingTime)
      .reduce((acc, msg) => acc + (msg.metadata!.processingTime!), 0) / 
      Math.max(1, messages.filter(msg => msg.metadata?.processingTime).length),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed inset-0 z-50 bg-white flex flex-col",
        "md:relative md:inset-auto md:bg-transparent ",
        "md:min-w-[54rem] md:max-w-[54rem] md:mx-auto md:h-[calc(100vh-156px)]"
      )}
    >
      {/* Enhanced Header */}
      {messages.length > 0 && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "flex items-center justify-between p-4 border-b border-outlines",
            "md:p-6"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-brand-500 text-clear text-lg font-medium relative"
            )}>
              <img src="/home/ghosty-avatar.svg" alt="ghosty" />
              {/* Status indicator */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                isProcessing ? "bg-yellow-400 animate-pulse" : "bg-green-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-dark">Ghosty IA</h2>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  agentMode === 'local' && "bg-blue-100 text-blue-600",
                  agentMode === 'remote' && "bg-purple-100 text-purple-600", 
                )}>
                  {agentMode === 'local' && '🏠 Local'}
                  {agentMode === 'remote' && '🌐 GPT-5'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {getStateDisplayMessage(currentState) || 'Tu asistente potenciado con GPT-5 y herramientas avanzadas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={cn(
                "text-sm px-3 py-2 rounded-lg text-gray-600 hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200 flex items-center gap-1",
                showStats && "bg-brand-100/60"
              )}
            >
              <BsGraphUp />
              {sessionStats.toolsExecuted > 0 && (
                <span className="text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded-full">
                  {sessionStats.toolsExecuted}
                </span>
              )}
            </button>

            {/* Export button */}
            {onExportChat && (
              <button
                onClick={onExportChat}
                className={cn(
                  "text-sm px-3 py-2 rounded-lg text-gray-600 hover:text-dark",
                  "hover:bg-brand-100/40 transition-all duration-200"
                )}
              >
                Exportar
              </button>
            )}

            {/* New chat button */}
            <button
              onClick={clearChat}
              className={cn(
                "text-sm px-3 py-2 rounded-full text-white bg-dark",
                "hover:bg-dark/80 transition-all duration-200 flex gap-1 items-center"
              )}
            >
              <BsStars />
              Nuevo chat
            </button>

            {/* Collapse button */}
            <button
              onClick={onCollapseChat}
              className={cn(
                "text-lg px-3 py-2 rounded-lg text-gray-600 hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200 md:hidden"
              )}
            >
              ✕
            </button>
          </div>
        </motion.header>
      )}

      {/* Session Stats Panel */}
      {showStats && hasMessages && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200/60"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">💬</span>
              <div>
                <p className="font-medium text-gray-700">{sessionStats.totalMessages}</p>
                <p className="text-xs text-gray-500">Mensajes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-purple-600">🛠️</span>
              <div>
                <p className="font-medium text-gray-700">{sessionStats.toolsExecuted}</p>
                <p className="text-xs text-gray-500">Herramientas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-green-600">⚡</span>
              <div>
                <p className="font-medium text-gray-700">{sessionStats.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Tokens</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-orange-600">⏱️</span>
              <div>
                <p className="font-medium text-gray-700">
                  {Math.round(sessionStats.averageResponseTime)}ms
                </p>
                <p className="text-xs text-gray-500">Respuesta Avg</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages Area */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 space-y-4",
        "md:p-6"
      )}>
        {!hasMessages ? (
          // Enhanced Welcome message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 relative",
              "bg-brand-500 text-clear text-2xl flex items-center justify-center"
            )}>
              <img className="w-full h-full" src="/home/ghosty-avatar.svg" alt="ghosty" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-dark mb-2">
              ¡Hola! Soy Ghosty IA ⚡
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-4">
              Ahora potenciado con <strong>LlamaIndex</strong>. Puedo consultar tus chatbots, 
              analizar estadísticas detalladas, buscar información en tiempo real y mucho más.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mt-6 text-sm">
              <div className="flex items-center gap-2 text-blue-600">
                <BsLightning />
                <span>Respuestas más rápidas</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <BsGear />
                <span>Herramientas avanzadas</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <BsStars />
                <span>Sugerencias inteligentes</span>
              </div>
            </div>
          </motion.div>
        ) : (
          // Messages list with progress indicator
          <div className="space-y-4">
            {/* Progress Indicator */}
            <AnimatePresence>
              {isProcessing && (
                <GhostyProgressIndicator
                  currentState={currentState}
                  toolProgress={toolProgress}
                  currentThought={currentThought}
                  getToolDisplayName={getToolDisplayName}
                  getStateDisplayMessage={getStateDisplayMessage}
                />
              )}
            </AnimatePresence>

            {/* Messages */}
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GhostyEnhancedMessage
                    message={message}
                    onRegenerate={regenerateResponse}
                    onSuggestionClick={handleSuggestionClick}
                    userImage={userImage}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-4 rounded-lg bg-red-50 border border-red-200",
                    "text-red-700"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Error de conexión</p>
                      <p className="text-xs text-red-600 mb-3">{error}</p>
                      <button
                        onClick={() => {
                          const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
                          if (lastUserMessage) {
                            sendMessage(lastUserMessage.content);
                          }
                        }}
                        className={cn(
                          "text-xs px-3 py-1 rounded bg-red-600 text-white",
                          "hover:bg-red-700 transition-all duration-200"
                        )}
                      >
                        🔄 Reintentar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "p-4 bg-white border-t border-gray-200/60",
          "md:p-6"
        )}
      >
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Pregúntame sobre tus chatbots, estadísticas, o cualquier cosa..."
              disabled={isProcessing}
              className={cn(
                "w-full px-4 py-3 rounded-full border border-outlines",
                "focus:border-brand-500 focus:ring-brand-500 focus:border-brand-500 focus:outline-none",
                "text-dark placeholder:text-gray-400",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                isInputFocused && "border-brand-500 shadow-sm"
              )}
            />
            
            {/* Enhanced character count with status */}
            <div className={cn(
              "absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2",
              "text-xs",
              inputValue.length > 0 ? "opacity-100" : "opacity-0",
              "transition-opacity duration-200"
            )}>
              <span className={cn(
                inputValue.length > 400 ? "text-red-500" : "text-gray-400"
              )}>
                {inputValue.length}/500
              </span>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isProcessing}
            isDisabled={!inputValue.trim() || isProcessing}
            className={cn(
              "h-12 px-6 mt-0 relative",
              "disabled:opacity-50"
            )}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse" />
                <span>Procesando...</span>
              </div>
            ) : (
              'Enviar'
            )}
          </Button>
        </form>

        {/* Enhanced footer with mode and stats */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>Enter para enviar • Esc para cerrar</span>
            {sessionStats.toolsExecuted > 0 && (
              <span className="flex items-center gap-1">
                <BsLightning className="text-brand-500" />
                {sessionStats.toolsExecuted} herramientas ejecutadas
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{messages.length} mensajes</span>
            <span>•</span>
            <span className="text-brand-500 font-medium">LlamaIndex ⚡</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};