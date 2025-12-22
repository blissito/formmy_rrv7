import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, GroupAnimation } from "motion/react";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";
import { LoadingIndicator } from "./GhostyMessage";
import type {
  GhostyLlamaMessage,
  GhostyLlamaState,
  ToolProgress,
} from "./types";
import { BsStars } from "react-icons/bs";
// Vercel's AI SDK
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FaRegUser } from "react-icons/fa";
import { Streamdown } from "streamdown";
import { BiGhost } from "react-icons/bi";
import { HiArrowDown } from "react-icons/hi";
import { ArtifactProvider, useArtifact } from "~/hooks/useArtifact";
import { Artifact, ArtifactInline } from "./artifact/ArtifactV0";
import {
  formatArtifactEventMessage,
  createArtifactEventMetadata,
} from "~/lib/artifact-events";
import {
  ArtifactActionBubble,
  isArtifactActionMessage,
} from "~/components/chat/ArtifactActionBubble";
import type { UIMessage } from "ai";

/**
 * Busca el confirmArtifactTool en estado input-available
 * Patrón HITL de Vercel AI SDK
 */
const findPendingConfirmArtifactTool = (messages: UIMessage[]): { toolCallId: string } | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message.parts) continue;

    for (const part of message.parts) {
      if (
        part.type === "tool-confirmArtifactTool" &&
        "state" in part &&
        part.state === "input-available" &&
        "toolCallId" in part
      ) {
        return { toolCallId: part.toolCallId as string };
      }
    }
  }
  return null;
};

interface GhostyChatInterfaceProps {
  messages: GhostyLlamaMessage[];
  currentState: GhostyLlamaState;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onCollapseChat: () => void;
  onRegenerateResponse: (messageId: string) => void;
  onExportChat?: () => void;
  error?: string | null;
  userImage?: string;
  toolProgress: ToolProgress[];
  currentThought: string;
  getToolDisplayName: (toolName: string) => string;
  getStateDisplayMessage: (state: GhostyLlamaState) => string;
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
  userImage,
  toolProgress,
  currentThought,
  getToolDisplayName,
  getStateDisplayMessage,
}: GhostyChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute isProcessing early so it can be used in effects
  const isProcessing = [
    "thinking",
    "tool-analyzing",
    "tool-chatbots",
    "tool-stats",
    "tool-web-search",
    "tool-web-fetch",
    "synthesizing",
    "streaming",
  ].includes(currentState);

  // Vercel AI SDK - declare early so it can be used in effects
  const {
    messages: vercelMessages,
    sendMessage,
    addToolOutput,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/chat/vercel",
    }),
  });

  // Scroll to bottom function (for manual button click)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  }, []);

  // Check if user is near bottom of chat
  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 150; // pixels from bottom
    const position =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = position < threshold;

    setShowScrollButton(!nearBottom && vercelMessages.length > 0);
  }, [vercelMessages.length]);

  // Handle scroll events to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce the check
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkIfNearBottom();
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [checkIfNearBottom]);

  // Auto-scroll when messages change (new messages OR content updates from streaming)
  useEffect(() => {
    if (vercelMessages.length === 0) return;

    // Use requestAnimationFrame to ensure DOM has fully updated
    const rafId = requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const threshold = 200; // Increased threshold for better UX
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      // Check if user is reasonably near bottom
      const nearBottom = distanceFromBottom < threshold;

      // Always scroll if: first message, processing (streaming), or near bottom
      const shouldAutoScroll =
        vercelMessages.length === 1 || nearBottom || status === "streaming";

      if (shouldAutoScroll) {
        // Scroll to bottom
        messagesEndRef.current?.scrollIntoView({
          behavior: vercelMessages.length === 1 ? "auto" : "smooth",
        });
        setShowScrollButton(false);
      } else {
        // User scrolled up - show scroll button
        setShowScrollButton(distanceFromBottom > threshold);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [vercelMessages, status]); // Listen to full messages array AND status

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Re-focus input after processing completes
  useEffect(() => {
    if (!isProcessing) {
      // Small delay to ensure DOM updates are complete
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isProcessing]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape") {
      onCollapseChat();
    }
  };

  // Map advanced states to simple display messages
  const getSimpleStateMessage = (state: GhostyLlamaState, thought?: string) => {
    if (thought) return thought;

    switch (state) {
      case "tool-analyzing":
        return "Analizando herramientas...";
      case "tool-chatbots":
        return "Consultando chatbots...";
      case "tool-stats":
        return "Obteniendo estadísticas...";
      case "tool-web-search":
        return "Buscando información...";
      case "tool-web-fetch":
        return "Obteniendo datos...";
      case "synthesizing":
        return "Organizando información...";
      case "thinking":
        return "Procesando...";
      case "streaming":
        return "Escribiendo respuesta...";
      default:
        return getStateDisplayMessage(state);
    }
  };

  const hasVercelMessages = vercelMessages.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // if (inputValue.trim() && !isProcessing) {
    //   onSendMessage(inputValue.trim());
    //   setInputValue("");
    // }
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  return (
    <ArtifactProvider>
      <article className="flex h-[90vh] ">
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: "100%" }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring" }}
          className={cn(
            // "transition-all duration-300 ease-in-out flex flex-col bg-white fixed inset-0 z-50 md:relative md:inset-auto md:min-w-[54rem] md:max-w-[54rem] md:mx-auto md:h-[calc(100vh-156px)]",
            "flex flex-col flex-1",
            "max-w-3xl mx-auto"
          )}
        >
          {/* Header - Solo se muestra cuando hay mensajes */}
          {hasVercelMessages && (
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "flex items-center justify-between p-4 border-b border-outlines",
                "md:p-6",
                ""
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "bg-brand-500 text-clear text-lg font-medium relative"
                  )}
                >
                  <img src="/home/ghosty-avatar.svg" alt="ghosty" />
                  {/* Status indicator */}
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                      isProcessing
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-green-400"
                    )}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-dark w-max">
                    Ghosty IA
                  </h2>
                </div>
              </div>
              <p className="text-sm text-irongray md:hidden">
                {isProcessing
                  ? getSimpleStateMessage(currentState, currentThought)
                  : "Tu asistente potenciado con herramientas avanzadas"}
              </p>

              <div className="flex items-center gap-2">
                {/* Export button */}
                {onExportChat && (
                  <button
                    onClick={onExportChat}
                    className={cn(
                      "text-sm px-3 py-2 rounded-lg text-irongray hover:text-dark",
                      "hover:bg-brand-100/40 transition-all duration-200",
                      "md:hidden"
                    )}
                  >
                    Exportar
                  </button>
                )}

                {/* Clear button */}
                <button
                  onClick={onClearChat}
                  className={cn(
                    "text-sm px-3 py-2 rounded-full text-white  bg-dark flex gap-1 items-center",
                    "hover:bg-dark/80 transition-all duration-200",
                    "w-max",
                    "ml-3"
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
          <div
            ref={messagesContainerRef}
            className={cn(
              "flex-1 overflow-y-auto p-4 space-y-4 relative",
              "md:p-6"
            )}
          >
            {!hasVercelMessages ? (
              // Welcome message
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center py-12"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-4",
                    "bg-brand-500 text-clear text-2xl flex items-center justify-center"
                  )}
                >
                  <img
                    className="w-full h-full"
                    src="/home/ghosty-avatar.svg"
                    alt="ghosty"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-dark mb-2">
                  ¡Hola! Soy Ghosty IA
                </h3>
                <p className="text-irongray max-w-md mx-auto leading-relaxed">
                  Puedo ayudarte a configurar chatbots, analizar métricas,
                  optimizar formularios y resolver cualquier pregunta sobre
                  Formmy.
                </p>
              </motion.div>
            ) : (
              // Messages list
              <div className="space-y-4">
                <AnimatePresence>
                  {vercelMessages.map((message) => {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "bg-gray-50 p-3 rounded-xl flex items-center gap-4",
                          "w-fit",
                          "items-start",
                          {
                            "flex-row-reverse ml-auto": message.role === "user",
                          }
                        )}
                      >
                        {/* <GhostyMessageComponent
                    message={message}
                    onRegenerate={onRegenerateResponse}
                    onSuggestionClick={handleSuggestionClick}
                    userImage={userImage}
                  /> */}
                        <p className="pt-1">
                          {message.role === "user" ? (
                            <FaRegUser />
                          ) : (
                            <BiGhost />
                          )}
                        </p>

                        <span className="font-medium">
                          {(() => {
                            // Detectar si hay un tool call en este mensaje
                            const hasToolCall = message.parts.some((part) =>
                              part.type.includes("tool-")
                            );

                            return (
                              <>
                                {/* SIEMPRE renderizar el texto de respuesta */}
                                {message.parts.map((part, idx) => {
                                  if (part.type === "text") {
                                    // Detectar si es un mensaje de evento de artefacto legacy
                                    if (message.role === "user" && isArtifactActionMessage(part.text)) {
                                      return (
                                        <div key={idx} className="my-1">
                                          <ArtifactActionBubble text={part.text} />
                                        </div>
                                      );
                                    }
                                    return (
                                      <>
                                        <Streamdown key={idx}>
                                          {part.text}
                                        </Streamdown>
                                        <br />
                                      </>
                                    );
                                  }
                                  return null;
                                })}
                                {/* Mostrar tool indicator si hay tool calls */}
                                {hasToolCall && (
                                  <div className="mb-2 space-y-1">
                                    {/* Botón para abrir artefacto si el tool fue invocado */}
                                    {message.parts.find(
                                      (part) =>
                                        part.type === "tool-openArtifactTool" &&
                                        "state" in part &&
                                        part.state === "output-available"
                                    ) && <ArtifactInline />}
                                    {message.parts
                                      .filter(
                                        (part) =>
                                          part.type === "tool-getContextTool"
                                      )
                                      .map((part, indx) => (
                                        <p
                                          key={indx}
                                          className={cn(
                                            "inline mr-1",
                                            "text-xs rounded-xl px-2 py-1 w-fit",
                                            part.state === "output-available"
                                              ? "text-gray-700 bg-green-200"
                                              : "text-white bg-orange-200"
                                          )}
                                        >
                                          {part.state === "output-available"
                                            ? "🔧 Documentación leída"
                                            : "🔧 Buscando en documentación..."}
                                        </p>
                                      ))}

                                    {/* selfUserTool - Mostrar info del usuario */}
                                    {message.parts
                                      .filter(
                                        (part) =>
                                          part.type === "tool-selfUserTool"
                                      )
                                      .map((part, idx) => {
                                        if (
                                          part.type === "tool-selfUserTool" &&
                                          part.state === "output-available"
                                        ) {
                                          return (
                                            <motion.div
                                              key={idx}
                                              className="bg-brand-300 p-4 rounded-2xl w-fit"
                                              initial={{
                                                y: -100,
                                                filter: "blur(4px)",
                                              }}
                                              animate={{
                                                y: 0,
                                                filter: "blur(0px)",
                                              }}
                                              whileHover={{ scale: 0.95 }}
                                              transition={{
                                                type: "spring",
                                                bounce: 0.6,
                                              }}
                                            >
                                              <div className="space-y-2">
                                                <p>
                                                  <strong>ID:</strong>{" "}
                                                  {part.output?.id}
                                                </p>
                                                <p>
                                                  <strong>Email:</strong>{" "}
                                                  {part.output?.email}
                                                </p>
                                                <p>
                                                  <strong>Plan:</strong>{" "}
                                                  {part.output?.plan}
                                                </p>
                                                <p>
                                                  <strong>
                                                    Créditos usados:
                                                  </strong>{" "}
                                                  {part.output?.toolCreditsUsed}
                                                </p>
                                                <div className="flex gap-4">
                                                  <img
                                                    // src="http://localhost:3000/dash/logo-full.svg"
                                                    src={
                                                      part.output.picture ||
                                                      "http://localhost:3000/dash/logo-full.svg"
                                                    }
                                                    alt="user pic"
                                                    className="w-16 h-16 rounded-full hover:scale-110 transition-all"
                                                  />
                                                  <a
                                                    target="_blank"
                                                    href="/profile"
                                                  >
                                                    <Button variant="secondary">
                                                      Ir al perfil
                                                    </Button>
                                                  </a>
                                                </div>
                                              </div>
                                            </motion.div>
                                          );
                                        }
                                        return null;
                                      })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </span>
                      </motion.div>
                    );
                  })}
                  {status !== "ready" && <LoadingIndicator />}
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
                          <p className="text-sm font-medium mb-2">
                            Error de conexión
                          </p>
                          <p className="text-xs text-red-600 mb-3">{error}</p>
                          <button
                            onClick={() => {
                              // Get last user message and retry (using reverse + find for better compatibility)
                              const lastUserMessage = [...messages]
                                .reverse()
                                .find((m) => m.role === "user");
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

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => scrollToBottom()}
                  className={cn(
                    "absolute bottom-4 right-4 z-10",
                    "w-10 h-10 rounded-full",
                    "bg-brand-500 text-white shadow-lg",
                    "flex items-center justify-center",
                    "hover:bg-brand-600 hover:scale-110",
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  aria-label="Scroll to bottom"
                >
                  <HiArrowDown className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              // "pb-4 px-4 pt-2 bg-white",
              // "md:pb-6 md:px-6 md:pt-3",
              "px-5 py-3"
              // "mt-auto"
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
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Escribe tu mensaje..."
                  disabled={isProcessing}
                  className={cn(
                    "w-full px-4 py-3 rounded-full border border-outlines",
                    "focus:ring-brand-500 focus:border-brand-500 focus:outline-none",
                    "text-dark placeholder:text-lightgray",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200",
                    isInputFocused && "border-brand-500"
                  )}
                />

                {/* Character count or shortcuts hint */}
                <div
                  className={cn(
                    "absolute right-4 top-1/2 transform -translate-y-1/2",
                    "text-xs text-lightgray",
                    inputValue.length > 0 ? "opacity-100" : "opacity-0",
                    "transition-opacity duration-200"
                  )}
                >
                  {inputValue.length}/500
                </div>
              </div>

              <Button
                id="ghosty-send-button"
                type="submit"
                isLoading={isProcessing}
                isDisabled={!inputValue.trim() || isProcessing}
                className={cn("h-12 px-6 mt-0", "disabled:opacity-50")}
              >
                {isProcessing ? "Enviando..." : "Enviar"}
              </Button>
            </form>

            {/* Shortcuts hint */}
            <div className="flex justify-between items-center mt-2 text-xs text-lightgray">
              <span>Enter para enviar • Esc para cerrar</span>
              <span>{vercelMessages.length} mensajes</span>
            </div>
          </motion.div>
        </motion.div>

        <Artifact
          messages={vercelMessages}
          onArtifactEvent={(eventName, payload, artifactName) => {
            console.log(`[Ghosty Artifact Event] ${eventName}:`, payload);

            // 🎯 PATRÓN HITL: Buscar confirmArtifactTool pendiente
            const pendingConfirm = findPendingConfirmArtifactTool(vercelMessages);

            if (pendingConfirm) {
              // ✅ Usar addToolOutput (patrón Vercel AI SDK)
              console.log(`[Ghosty] Using addToolOutput for ${eventName}`);
              addToolOutput({
                tool: "confirmArtifactTool",
                toolCallId: pendingConfirm.toolCallId,
                output: JSON.stringify({
                  confirmed: eventName === "onConfirm",
                  event: eventName,
                  data: payload,
                  artifactName,
                }),
              });
              // Continuar la conversación después de agregar el output
              sendMessage({ text: "" });
            } else {
              // Fallback: enviar mensaje (compatibilidad)
              console.log(`[Ghosty] No pending confirmArtifactTool, using sendMessage`);
              const friendlyMessage = formatArtifactEventMessage(
                eventName,
                payload as Record<string, unknown>
              );
              const metadata = createArtifactEventMetadata(
                eventName,
                payload as Record<string, unknown>,
                artifactName
              );
              sendMessage({ text: friendlyMessage }, { metadata });
            }
          }}
        />
      </article>
    </ArtifactProvider>
  );
};
