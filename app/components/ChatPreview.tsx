import { useState, useRef, useEffect, useCallback } from "react";
// Removed redundant openrouter.client - using unified API endpoint
import { DEFAULT_AI_MODEL } from "../utils/constants";
import { cn } from "~/lib/utils";
import { isAnthropicDirectModel } from "~/utils/aiModels";
import type { Chatbot } from "@prisma/client";
import { ChatInput, type ChatInputRef } from "./chat/ChatInput";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatHeader } from "./chat/ChatHeader";
import { StreamToggle } from "./chat/StreamToggle";
import { LoadingIndicator } from "./chat/LoadingIndicator";
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export interface ChatPreviewProps {
  chatbot: Chatbot;
  production?: boolean;
  onClose?: () => void;
}

// Función unificada para prompts optimizados (versión cliente)
// La lógica se mantiene en el servidor - aquí solo básico para producción
function buildBasicSystemPrompt(chatbot: Chatbot): string {
  let prompt = chatbot.instructions || "Eres un asistente útil.";

  if (chatbot.customInstructions && chatbot.customInstructions.trim()) {
    prompt += "\n\n=== INSTRUCCIONES ESPECÍFICAS ===\n";
    prompt += chatbot.customInstructions;
    prompt += "\n=== FIN INSTRUCCIONES ESPECÍFICAS ===\n";
  }

  return prompt;
}

export default function ChatPreview({
  chatbot,
  production,
  onClose,
}: ChatPreviewProps) {
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content: chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [stream, setStream] = useState(true); // ✅ STREAMING HABILITADO - AgentEngine V0 con SSE funcionando
  const inputRef = useRef<ChatInputRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);

  // 🔄 SessionId con TTL de 24h - se regenera automáticamente después de 24h
  const getOrCreateSessionId = () => {
    if (typeof window === "undefined")
      return `${production ? "prod" : "preview"}-${chatbot.id}-${Date.now()}`;

    const storageKey = `formmy-session-${chatbot.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const { sessionId, timestamp } = JSON.parse(stored);
        const age = Date.now() - timestamp;
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas

        // Si la sesión tiene menos de 24h, reutilizarla
        if (age < MAX_AGE) {
          return sessionId;
        }
      } catch (e) {
        // Si hay error parseando, crear nueva sesión
      }
    }

    // Crear nueva sesión
    const newSessionId = `${production ? "prod" : "preview"}-${chatbot.id}-${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify({
      sessionId: newSessionId,
      timestamp: Date.now()
    }));

    return newSessionId;
  };

  // SessionId persistente con reset automático cada 24h
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  // VisitorId persistente para usuarios anónimos (público)
  const getOrCreateVisitorId = () => {
    if (typeof window === "undefined") return "";

    const storageKey = `formmy-visitor-${chatbot.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) return stored;

    // Generar nuevo visitorId y persistir
    const newVisitorId = `visitor-${chatbot.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(storageKey, newVisitorId);
    return newVisitorId;
  };

  const visitorIdRef = useRef<string>(getOrCreateVisitorId());

  useEffect(() => {
    setChatMessages((m) => {
      const update = [...m];
      update[0] = {
        role: "assistant",
        content: chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?",
      };
      return update;
    });
    // ✅ STREAMING HABILITADO - mantener el estado del usuario
    // Nota: El usuario puede cambiar el toggle manualmente
  }, [chatbot]);

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // If user scrolled up, disable auto-scroll
    if (!isNearBottom && !isUserScrolling) {
      setIsUserScrolling(true);
      setShouldAutoScroll(false);
    }

    // If user scrolled back to bottom, enable auto-scroll
    if (isNearBottom && isUserScrolling) {
      setIsUserScrolling(false);
      setShouldAutoScroll(true);
    }
  };

  // Mostrar mensaje de despedida después de inactividad
  const showGoodbyeMessage = useCallback(() => {
    if (chatbot.goodbyeMessage && !isConversationEnded) {
      const newMessage = {
        role: "assistant" as const,
        content: chatbot.goodbyeMessage,
      };
      setChatMessages((prev) => [...prev, newMessage]);
      setIsConversationEnded(true);
    }
  }, [chatbot.goodbyeMessage, isConversationEnded]);

  // Reiniciar el temporizador de inactividad
  const resetInactivityTimer = useCallback(() => {
    // Limpiar el temporizador existente
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Establecer un nuevo temporizador (5 minutos de inactividad)
    // @ts-ignore - setTimeout returns a number in the browser
    inactivityTimerRef.current = window.setTimeout(
      () => {
        showGoodbyeMessage();
      },
      5 * 60 * 1000
    ); // 5 minutos
  }, [showGoodbyeMessage]);

  // Configurar el temporizador de inactividad
  useEffect(() => {
    // Iniciar el temporizador inicial
    resetInactivityTimer();

    // Limpiar el temporizador al desmontar el componente
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
    // Reiniciar el temporizador cuando hay nuevos mensajes
    if (!isConversationEnded) {
      resetInactivityTimer();
    }
  }, [
    chatMessages,
    shouldAutoScroll,
    resetInactivityTimer,
    isConversationEnded,
  ]);

  // Auto-scroll when streaming updates
  useEffect(() => {
    if (stream && chatLoading) {
      scrollToBottom();
    }
  }, [chatMessages, stream, chatLoading]);

  // Limpiar conversación
  const handleClearConversation = () => {
    setChatMessages([
      {
        role: "assistant",
        content: chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?",
      },
    ]);
    setChatError(null);
    setIsConversationEnded(false);

    // 🆕 Regenerar sessionId para forzar nueva conversación (memoria limpia)
    const newSessionId = `${production ? "prod" : "preview"}-${chatbot.id}-${Date.now()}`;
    sessionIdRef.current = newSessionId;

    // Actualizar localStorage con nueva sesión
    const storageKey = `formmy-session-${chatbot.id}`;
    localStorage.setItem(storageKey, JSON.stringify({
      sessionId: newSessionId,
      timestamp: Date.now()
    }));
  };

  const handleChatSend = async () => {
    if (isConversationEnded) {
      // Si la conversación ya terminó, no hacer nada
      return;
    }
    if (!chatInput.trim()) return;

    const currentInput = chatInput.trim();
    setChatLoading(true);
    setChatError(null);

    const userMessage = { role: "user" as const, content: currentInput };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");

    // Reset auto-scroll when sending a new message
    setIsUserScrolling(false);
    setShouldAutoScroll(true);

    // ✅ SIEMPRE STREAMING - Backend solo soporta SSE
    setChatMessages((msgs) => [...msgs, { role: "assistant", content: "" }]);

    // 🚀 Usar endpoint moderno AgentWorkflow simplificado
    {
      const formData = new FormData();
      formData.append("intent", "chat");
      formData.append("chatbotId", chatbot.id);
      formData.append("message", currentInput);
      formData.append("sessionId", sessionIdRef.current);
      formData.append("visitorId", visitorIdRef.current); // Para usuarios anónimos (público)
      formData.append("conversationHistory", JSON.stringify(updatedMessages));
      formData.append("stream", stream.toString()); // Usar valor real del toggle

      // Timeout de seguridad para evitar loading infinito
      const timeoutId = setTimeout(() => {
        setChatLoading(false);
        inputRef.current?.focus();
      }, 30000);

      fetch("/api/v0/chatbot", {
        method: "POST",
        body: formData,
      })
        .then(async (response) => {
          // ✅ Manejar errores del servidor con mensajes específicos
          if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json();
              // Usar el mensaje del servidor si está disponible
              const serverMessage =
                errorData.userMessage || errorData.error || errorData.message;
              throw new Error(
                serverMessage || `Error del servidor (${response.status})`
              );
            }
            throw new Error(`Error del servidor (${response.status})`);
          }

          // ✅ ARREGLO: Verificar si es JSON (tools) o streaming
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/json")) {
            // Es una respuesta JSON (framework formmy-agent o legacy)
            const jsonData = await response.json();

            // ✅ UNIFICADO: Soportar tanto framework como respuestas legacy
            const responseContent =
              jsonData.message || jsonData.response || jsonData.content;
            const hasValidResponse =
              responseContent && typeof responseContent === "string";

            if (hasValidResponse) {
              // Mostrar la respuesta completa directamente
              setChatMessages((msgs) => {
                const newMsgs = [...msgs];
                newMsgs[newMsgs.length - 1] = {
                  role: "assistant",
                  content: responseContent,
                };
                return newMsgs;
              });

              clearTimeout(timeoutId);
              setChatLoading(false);
              inputRef.current?.focus();
              return;
            } else {
              throw new Error(jsonData.error || "Respuesta vacía del servidor");
            }
          }

          // Lógica original para streaming
          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            let hasReceivedFirstChunk = false;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6);

                  try {
                    const data = JSON.parse(dataStr);

                    // Manejar evento de finalización
                    if (data.type === "done") {
                      clearTimeout(timeoutId);
                      setChatLoading(false);
                      inputRef.current?.focus();
                      return; // Salir completamente de toda la función fetch
                    }

                    // Manejar chunks de contenido
                    if (data.type === "chunk" && data.content) {
                      // ✅ Ocultar loading indicator en el primer chunk
                      if (!hasReceivedFirstChunk) {
                        setChatLoading(false);
                        hasReceivedFirstChunk = true;
                      }

                      fullContent += data.content;
                      setChatMessages((msgs) => {
                        const updated = [...msgs];
                        let lastIdx = updated.length - 1;
                        while (
                          lastIdx >= 0 &&
                          updated[lastIdx].role !== "assistant"
                        )
                          lastIdx--;
                        if (lastIdx >= 0)
                          updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: fullContent,
                          };
                        return updated;
                      });
                    }

                    // ✅ Manejar tool events del AgentWorkflow
                    if (data.type === "tool-start" && data.tool) {
                      // Actualizar estado de loading para mostrar tool siendo ejecutado
                      // NO agregar al fullContent para que no se quede en el mensaje final
                      setChatLoading(true);
                    }

                    // ✅ Manejar metadata final
                    if (data.type === "metadata" && data.metadata) {
                      // Log metadata para debugging (opcional)
                      console.log("✅ AgentWorkflow completed:", data.metadata);
                    }

                    // ✅ Manejar errores del workflow
                    if (data.type === "error" && data.content) {
                      clearTimeout(timeoutId);
                      setChatLoading(false);
                      setChatError(data.content);
                      setChatMessages((msgs) => {
                        const updated = [...msgs];
                        let lastIdx = updated.length - 1;
                        while (
                          lastIdx >= 0 &&
                          updated[lastIdx].role !== "assistant"
                        )
                          lastIdx--;
                        if (lastIdx >= 0)
                          updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: data.content,
                          };
                        return updated;
                      });
                      inputRef.current?.focus();
                      return;
                    }

                    // Manejar errores
                    if (data.type === "error") {
                      clearTimeout(timeoutId);
                      setChatError(data.content || "Error del servidor");
                      setChatLoading(false);
                      inputRef.current?.focus();
                      return;
                    }
                  } catch (e) {
                    console.warn("Failed to parse SSE chunk:", dataStr);
                  }
                }
              }
            }
          }

          // Si llegamos aquí sin [DONE], limpiar loading
          clearTimeout(timeoutId);
          setChatLoading(false);
          inputRef.current?.focus();
        })
        .catch((err: unknown) => {
          clearTimeout(timeoutId);

          // Mensajes de error amigables para el usuario
          const errorMessage = err instanceof Error ? err.message : String(err);
          let userFriendlyMessage = errorMessage;

          // ✅ Si el mensaje del servidor ya es claro, usarlo directamente
          const isServerMessage =
            errorMessage.includes("desactivado") ||
            errorMessage.includes("disponible") ||
            errorMessage.includes("permisos") ||
            errorMessage.includes("plan no incluye");

          // Solo traducir errores técnicos a mensajes amigables
          if (!isServerMessage) {
            if (errorMessage.includes("rate") || errorMessage.includes("429")) {
              userFriendlyMessage =
                "Hemos alcanzado el límite de solicitudes. Por favor espera unos momentos e intenta de nuevo.";
            } else if (
              errorMessage.includes("timeout") ||
              errorMessage.includes("408")
            ) {
              userFriendlyMessage =
                "La respuesta está tardando más de lo esperado. Por favor intenta de nuevo.";
            } else if (
              errorMessage.includes("model") ||
              errorMessage.includes("400")
            ) {
              userFriendlyMessage =
                "Hay un problema con la configuración del asistente. Por favor contacta soporte.";
            } else if (
              errorMessage.includes("network") ||
              errorMessage.includes("fetch")
            ) {
              userFriendlyMessage =
                "Problema de conexión. Verifica tu internet e intenta de nuevo.";
            } else if (
              errorMessage.includes("500") ||
              errorMessage.includes("internal")
            ) {
              userFriendlyMessage =
                "Estamos experimentando problemas técnicos. Por favor intenta más tarde.";
            } else if (errorMessage.includes("Error del servidor")) {
              userFriendlyMessage =
                "Hubo un problema procesando tu mensaje. Por favor intenta de nuevo.";
            }
          }

          setChatError(userFriendlyMessage);
          setChatLoading(false);
          inputRef.current?.focus();

          // Log básico para debugging
          console.error("Chat error:", errorMessage);
        });
    }
  };

  return (
    <main
      className={cn("h-full max-h-[680px] ", {
        "bg-chatPattern bg-cover rounded-3xl  pt-6": !production,
      })}
    >
      {/* Stream toggle removed - usando AgentEngine V0 con streaming siempre activo */}

      <article
        className={cn(
          "border border-gray-200",
          "bg-white",
          "rounded-2xl",
          "flex flex-col",
          "overflow-hidden",
          {
            "h-full w-full shadow-2xl": production,
            "h-svh max-h-[600px] mb-6 max-w-lg mx-auto": !production,
          }
        )}
      >
        <ChatHeader
          primaryColor={chatbot.primaryColor || "#9A99EA"}
          name={chatbot.name}
          avatarUrl={chatbot.avatarUrl}
          onClear={handleClearConversation}
          showCloseButton={production}
          onClose={onClose}
        />

        <section
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="pr-4 grow pt-4 overflow-y-auto flex flex-col gap-2 "
        >
          {chatMessages
            .filter((msg) => msg.content !== "")
            .map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                primaryColor={chatbot.primaryColor || "#9A99EA"}
                avatarUrl={chatbot.avatarUrl}
              />
            ))}
          <div ref={messagesEndRef} />
        </section>

        <section>
          {chatLoading && (
            <MessageBubble
              role="assistant"
              primaryColor={chatbot.primaryColor || "#9A99EA"}
              avatarUrl={chatbot.avatarUrl}
            >
              <LoadingIndicator />
            </MessageBubble>
          )}
        </section>

        <ChatInput
          ref={inputRef}
          value={chatInput}
          onChange={(value) => {
            setChatInput(value);
            // Reiniciar el temporizador cuando el usuario está escribiendo
            if (!isConversationEnded) {
              resetInactivityTimer();
            }
          }}
          onSend={handleChatSend}
          disabled={chatLoading}
          error={chatError}
        />
      </article>
    </main>
  );
}
