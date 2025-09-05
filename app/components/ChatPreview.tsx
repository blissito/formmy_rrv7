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

export interface ChatPreviewProps {
  chatbot: Chatbot;
  production?: boolean;
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

export default function ChatPreview({ chatbot, production }: ChatPreviewProps) {
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
  const [stream, setStream] = useState(chatbot.enableStreaming !== false); // Respetar configuración de BD
  const inputRef = useRef<ChatInputRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);
  // SessionId persistente para mantener contexto conversacional
  const sessionIdRef = useRef<string>(`${production ? 'prod' : 'preview'}-${chatbot.id}-${Date.now()}`);


  useEffect(() => {
    setChatMessages((m) => {
      const update = [...m];
      update[0] = {
        role: "assistant",
        content: chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?",
      };
      return update;
    });
    // Actualizar configuración de streaming cuando cambie el chatbot
    setStream(chatbot.enableStreaming !== false);
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

  const handleChatSend = async () => {
    if (isConversationEnded) {
      // Si la conversación ya terminó, no hacer nada
      return;
    }
    if (!chatInput.trim()) return;
    
    // DEBUG CRÍTICO: Verificar qué modelo tiene el chatbot

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

    if (stream) {
      setChatMessages((msgs) => [...msgs, { role: "assistant", content: "" }]);
      
      // Usar siempre el endpoint interno unificado (tanto para preview como producción)
      {
        const formData = new FormData();
        formData.append("intent", "preview_chat");
        formData.append("chatbotId", chatbot.id);
        formData.append("message", currentInput);
        formData.append("sessionId", sessionIdRef.current);
        formData.append("conversationHistory", JSON.stringify(updatedMessages));
        formData.append("stream", "true");

        // Timeout de seguridad para evitar loading infinito
        const timeoutId = setTimeout(() => {
          setChatLoading(false);
          inputRef.current?.focus();
        }, 30000);

        fetch("/api/v1/chatbot", {
          method: "POST",
          body: formData,
        })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          // ✅ ARREGLO: Verificar si es JSON (tools) o streaming
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            // Es una respuesta JSON (framework formmy-agent o legacy)
            const jsonData = await response.json();
            
            // ✅ UNIFICADO: Soportar tanto framework como respuestas legacy
            const responseContent = jsonData.message || jsonData.response || jsonData.content;
            const hasValidResponse = responseContent && typeof responseContent === 'string';
            
            if (hasValidResponse) {
              // Mostrar la respuesta completa directamente
              setChatMessages((msgs) => {
                const newMsgs = [...msgs];
                newMsgs[newMsgs.length - 1] = {
                  role: "assistant",
                  content: responseContent
                };
                return newMsgs;
              });
              
              // 🎯 LOG DEBUG para marketing/monitoring
              if (jsonData.frameworkUsed === 'formmy-agent') {
                console.log(`🤖 Formmy Agent: ${jsonData.iterations} iterations, tools: [${jsonData.toolsUsed?.join(', ') || 'none'}]`);
              }
              
              clearTimeout(timeoutId);
              setChatLoading(false);
              inputRef.current?.focus();
              return;
            } else {
              throw new Error(jsonData.error || 'Respuesta vacía del servidor');
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
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6);
                  
                  // Manejar [DONE] explícitamente
                  if (dataStr === '[DONE]' || dataStr.trim() === '[DONE]') {
                    clearTimeout(timeoutId);
                    setChatLoading(false);
                    inputRef.current?.focus();
                    return; // Salir completamente de toda la función fetch
                  }
                  
                  try {
                    const data = JSON.parse(dataStr);
                    if (data.content) {
                      // ✅ Ocultar loading indicator en el primer chunk
                      if (!hasReceivedFirstChunk) {
                        setChatLoading(false);
                        hasReceivedFirstChunk = true;
                      }
                      
                      fullContent += data.content;
                      setChatMessages((msgs) => {
                        const updated = [...msgs];
                        let lastIdx = updated.length - 1;
                        while (lastIdx >= 0 && updated[lastIdx].role !== "assistant")
                          lastIdx--;
                        if (lastIdx >= 0)
                          updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
                        return updated;
                      });
                    }
                  } catch (e) {
                    console.warn('Failed to parse chunk:', dataStr);
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
          setChatError(err instanceof Error ? err.message : String(err));
          setChatLoading(false);
          inputRef.current?.focus();
        });
      }
    } else {
      // Sin streaming - usar siempre el endpoint interno unificado
      {
        const formData = new FormData();
        formData.append("intent", "preview_chat");
        formData.append("chatbotId", chatbot.id);
        formData.append("message", currentInput);
        formData.append("sessionId", sessionIdRef.current);
        formData.append("conversationHistory", JSON.stringify(updatedMessages));
        formData.append("stream", "false");

        fetch("/api/v1/chatbot", {
          method: "POST",
          body: formData,
        })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          const result = await response.json();
          // ✅ UNIFICADO: Soportar framework formmy-agent y respuestas legacy
          const botContent = result.message || result.response || result.content || "Respuesta vacía";
          
          // 🎯 LOG DEBUG para marketing/monitoring
          if (result.frameworkUsed === 'formmy-agent') {
            console.log(`🤖 Formmy Agent: ${result.iterations} iterations, tools: [${result.toolsUsed?.join(', ') || 'none'}]`);
          }
          
          setChatMessages((msgs) => [
            ...msgs,
            { role: "assistant", content: botContent },
          ]);
          setChatLoading(false);
          inputRef.current?.focus();
        })
        .catch((err: unknown) => {
          setChatError(err instanceof Error ? err.message : String(err));
          setChatLoading(false);
          inputRef.current?.focus();
        });
      }
    }
  };

  return (
    <main
      className={cn("h-full max-h-[680px] ", {
        "bg-chatPattern bg-cover rounded-3xl  ": !production,
      })}
    >
      {!production && <StreamToggle stream={stream} onToggle={setStream} />}

      <article
        className={cn(
          "border",
          "border-gray-300",
          "h-svh max-h-[600px] mb-6", // @TODO Revisit
          "bg-[#fff]",
          "rounded-3xl",
          "flex flex-col",
          // Aquí cambiamos el ancho del chat
          "overflow-y-auto dark:bg-gray-800 max-w-lg mx-auto ",
          {
            "h-full w-full": production,
          }
        )}
      >
        <ChatHeader
          primaryColor={chatbot.primaryColor || "#63CFDE"}
          name={chatbot.name}
          avatarUrl={chatbot.avatarUrl}
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
                primaryColor={chatbot.primaryColor || "#63CFDE"}
                avatarUrl={chatbot.avatarUrl}
              />
            ))}
          <div ref={messagesEndRef} />
        </section>

        <section>
          {chatLoading && (
            <MessageBubble
              role="assistant"
              primaryColor={chatbot.primaryColor || "#63CFDE"}
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
