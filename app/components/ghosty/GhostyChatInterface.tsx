import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";
import { GhostyMessageComponent } from "./GhostyMessage";
import { GhostyThinkingBubble } from "./GhostyTyping";
import type { GhostyMessage, GhostyState } from './hooks/useGhostyChat';
import { BsStars } from "react-icons/bs";

interface GhostyChatInterfaceProps {
  messages: GhostyMessage[];
  currentState: GhostyState;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onCollapseChat: () => void;
  onRegenerateResponse: (messageId: string) => void;
  onExportChat?: () => void;
  error?: string | null;
  userImage?: string;
}

export const GhostyChatInterface = ({
  messages,
  currentState,
  onSendMessage,
  onClearChat,
  onCollapseChat,
  onRegenerateResponse,
  onExportChat,
  error,
  userImage
}: GhostyChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
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
    if (inputValue.trim() && currentState !== 'thinking' && currentState !== 'searching' && currentState !== 'streaming') {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
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

  const isLoading = currentState === 'thinking' || currentState === 'searching' || currentState === 'streaming';
  const hasMessages = messages.length > 0;

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
      {/* Header - Solo se muestra cuando hay mensajes */}
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
              "bg-brand-500 text-clear text-lg font-medium"
            )}>
              <img src="/home/ghosty-avatar.svg" alt="ghosty" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark">Ghosty IA</h2>
              <p className="text-sm text-irongray">
                {currentState === 'searching' ? 'Buscando...' : isLoading ? 'Procesando...' : 'Tu asistente para Formmy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export button */}
            {onExportChat && (
              <button
                onClick={onExportChat}
                className={cn(
                  "text-sm px-3 py-2 rounded-lg text-irongray hover:text-dark",
                  "hover:bg-brand-100/40 transition-all duration-200"
                )}
              >
                Exportar
              </button>
            )}

            {/* Clear button */}
            <button
              onClick={onClearChat}
              className={cn(
                "text-sm px-3 py-2 rounded-full text-irongray  bg-dark text-white flex gap-1 items-center",
                "hover:bg-dark/80 transition-all duration-200 "
              )}
            >
              <BsStars />
            Nuevo chat
            </button>

            {/* Collapse button */}
            <button
              onClick={onCollapseChat}
              className={cn(
                "text-lg px-3 py-2 rounded-lg text-irongray hover:text-dark",
                "hover:bg-brand-100/40 transition-all duration-200 md:hidden"
              )}
            >
              ✕
            </button>
          </div>
        </motion.header>
      )}

      {/* Messages Area */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 space-y-4",
        "md:p-6"
      )}>
        {!hasMessages ? (
          // Welcome message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4",
              "bg-brand-500 text-clear text-2xl flex items-center justify-center"
            )}>
              <img className="w-full h-full" src="/home/ghosty-avatar.svg" alt="ghosty" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-dark mb-2">
              ¡Hola! Soy Ghosty IA
            </h3>
            <p className="text-irongray max-w-md mx-auto leading-relaxed">
              Puedo ayudarte a configurar chatbots, analizar métricas, optimizar formularios 
              y resolver cualquier pregunta sobre Formmy.
            </p>
          </motion.div>
        ) : (
          // Messages list
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GhostyMessageComponent
                    message={message}
                    onRegenerate={onRegenerateResponse}
                    userImage={userImage}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Thinking bubble */}
            <AnimatePresence>
              {(currentState === 'thinking' || currentState === 'searching' || currentState === 'streaming') && (
                <GhostyThinkingBubble />
              )}
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
                          // Get last user message and retry (using reverse + find for better compatibility)
                          const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
                          if (lastUserMessage) {
                            onSendMessage(lastUserMessage.content);
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

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "p-4 bg-white",
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
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className={cn(
                "w-full px-4 py-3 rounded-full border border-outlines",
                "focus:border-brand-500 focus:ring-brand-500 focus:border-brand-500 focus:outline-none",
                "text-dark placeholder:text-lightgray",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                isInputFocused && "border-brand-500"
              )}
            />
            
            {/* Character count or shortcuts hint */}
            <div className={cn(
              "absolute right-4 top-1/2 transform -translate-y-1/2",
              "text-xs text-lightgray",
              inputValue.length > 0 ? "opacity-100" : "opacity-0",
              "transition-opacity duration-200"
            )}>
              {inputValue.length}/500
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            isDisabled={!inputValue.trim() || isLoading}
            className={cn(
              "h-12 px-6 mt-0",
              "disabled:opacity-50"
            )}
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>

        {/* Shortcuts hint */}
        <div className="flex justify-between items-center mt-2 text-xs text-lightgray">
          <span>Enter para enviar • Esc para cerrar</span>
          <span>{messages.length} mensajes</span>
        </div>
      </motion.div>
    </motion.div>
  );
};