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

// Helper function to estimate tokens (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Helper function to build enriched system prompt with contexts and token management
function buildEnrichedSystemPrompt(chatbot: Chatbot): string {
  let enrichedSystemPrompt = chatbot.instructions || "Eres un asistente útil.";
  
  // Agregar instrucciones personalizadas si existen
  if (chatbot.customInstructions && chatbot.customInstructions.trim()) {
    enrichedSystemPrompt += "\n\n=== INSTRUCCIONES ESPECÍFICAS ===\n";
    enrichedSystemPrompt += chatbot.customInstructions;
    enrichedSystemPrompt += "\n=== FIN INSTRUCCIONES ESPECÍFICAS ===\n";
  }
  
  // Agregar contextos del chatbot si existen (con gestión de tokens)
  if (chatbot.contexts && chatbot.contexts.length > 0) {
    const maxContextTokens = 3000; // Reservar 3000 tokens para contextos
    let contextTokensUsed = 0;
    let contextContent = "\n\n=== CONTEXTO Y CONOCIMIENTO ===\n";
    contextContent += "Usa la siguiente información para responder de manera más precisa y útil:\n\n";
    
    // Priorizar contextos por tipo (FAQ > text > file > url)
    const prioritizedContexts = [...chatbot.contexts].sort((a, b) => {
      const priority = { question: 0, text: 1, file: 2, url: 3 };
      return (priority[a.type as keyof typeof priority] || 4) - (priority[b.type as keyof typeof priority] || 4);
    });
    
    for (const [index, context] of prioritizedContexts.entries()) {
      let contextText = "";
      switch (context.type) {
        case "text":
          contextText = `**Información ${index + 1}**:\n${context.content}\n\n`;
          break;
        case "file":
          contextText = `**Documento ${index + 1}** (${context.fileName}):\n${context.content}\n\n`;
          break;
        case "url":
          contextText = `**Contenido Web ${index + 1}** (${context.url}):\n${context.content}\n\n`;
          break;
        case "question":
          contextText = `**FAQ ${index + 1}**:\nPregunta: ${context.question}\nRespuesta: ${context.content}\n\n`;
          break;
      }
      
      const contextTokens = estimateTokens(contextText);
      if (contextTokensUsed + contextTokens <= maxContextTokens) {
        contextContent += contextText;
        contextTokensUsed += contextTokens;
      } else {
        // Si el contexto es demasiado largo, truncarlo pero mantener la información clave
        const remainingTokens = maxContextTokens - contextTokensUsed;
        if (remainingTokens > 100) { // Solo agregar si hay espacio mínimo
          const truncatedContent = context.content.substring(0, remainingTokens * 4 * 0.8);
          contextContent += `**${context.type === 'question' ? 'FAQ' : 'Información'} ${index + 1}** (truncado):\n${truncatedContent}...\n\n`;
        }
        break; // No agregar más contextos
      }
    }
    
    contextContent += "=== FIN DEL CONTEXTO ===\n\n";
    contextContent += "IMPORTANTE: Usa esta información para dar respuestas precisas, específicas y útiles. Si la pregunta se relaciona con el contexto proporcionado, prioriza esa información.";
    
    enrichedSystemPrompt += contextContent;
  }
  
  return enrichedSystemPrompt;
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
  const [stream, setStream] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const inputRef = useRef<ChatInputRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);
  // SessionId persistente para mantener contexto conversacional
  const sessionIdRef = useRef<string>(`${production ? 'prod' : 'preview'}-${chatbot.id}-${Date.now()}`);

  // En producción, obtener la API key del chatbot
  useEffect(() => {
    if (production) {
      // Obtener la API key pública del chatbot
      fetch(`/api/v1/apikey?chatbotId=${chatbot.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.key) {
            setApiKey(data.key);
          }
        })
        .catch(console.error);
    }
  }, [production, chatbot.id]);

  useEffect(() => {
    setChatMessages((m) => {
      const update = [...m];
      update[0] = {
        role: "assistant",
        content: chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?",
      };
      return update;
    });
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
    console.log('🔥 CHATPREVIEW DEBUG:');
    console.log('chatbot.aiModel:', chatbot.aiModel);
    console.log('isAnthropicDirectModel:', isAnthropicDirectModel(chatbot.aiModel));

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
      
      // Determinar qué endpoint usar según el modo
      if (production && apiKey) {
        // En producción, usar el SDK con la API key del chatbot
        Effect.runPromise(
          sendOpenRouterMessageEffect({
            chatbotId: chatbot.id,
            apiKey: apiKey,
            model: chatbot.aiModel || DEFAULT_AI_MODEL,
            instructions: chatbot.instructions || "",
            temperature: chatbot.temperature,
            messages: [
              { role: "system", content: buildEnrichedSystemPrompt(chatbot) },
              ...updatedMessages,
            ],
            stream: true,
            onStreamChunk: (partial) => {
              setChatMessages((msgs) => {
                const updated = [...msgs];
                let lastIdx = updated.length - 1;
                while (lastIdx >= 0 && updated[lastIdx].role !== "assistant")
                  lastIdx--;
                if (lastIdx >= 0)
                  updated[lastIdx] = { ...updated[lastIdx], content: partial };
                return updated;
              });
            },
          })
        )
          .then(() => {
            setChatLoading(false);
            inputRef.current?.focus();
          })
          .catch((err: unknown) => {
            setChatError(err instanceof Error ? err.message : String(err));
            setChatLoading(false);
            inputRef.current?.focus();
          });
      } else {
        // En preview (dashboard), usar el endpoint interno
        const formData = new FormData();
        formData.append("intent", "preview_chat");
        console.log('📤 SENDING REQUEST: intent=preview_chat');
        formData.append("chatbotId", chatbot.id);
        formData.append("message", currentInput);
        formData.append("sessionId", sessionIdRef.current);
        formData.append("conversationHistory", JSON.stringify(updatedMessages));
        formData.append("stream", "true");

        fetch("/api/v1/chatbot", {
          method: "POST",
          body: formData,
        })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content) {
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
                    // Ignorar líneas que no son JSON válido
                  }
                }
              }
            }
          }
          
          setChatLoading(false);
          inputRef.current?.focus();
        })
        .catch((err: unknown) => {
          setChatError(err instanceof Error ? err.message : String(err));
          setChatLoading(false);
          inputRef.current?.focus();
        });
      }
    } else {
      // Sin streaming
      if (production && apiKey) {
        // En producción, usar el SDK con la API key del chatbot
        Effect.runPromise(
          sendOpenRouterMessageEffect({
            chatbotId: chatbot.id,
            apiKey: apiKey,
            model: chatbot.aiModel || DEFAULT_AI_MODEL,
            instructions: chatbot.instructions || "",
            temperature: chatbot.temperature,
            messages: [
              { role: "system", content: buildEnrichedSystemPrompt(chatbot) },
              ...updatedMessages,
            ],
            stream: false,
          })
        )
          .then((result: any) => {
            const botContent =
              result.choices?.[0]?.message?.content || "Respuesta vacía";
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
      } else {
        // En preview (dashboard), usar el endpoint interno
        const formData = new FormData();
        formData.append("intent", "preview_chat");
        console.log('📤 SENDING REQUEST: intent=preview_chat');
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
          const botContent = result.response || result.content || "Respuesta vacía";
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
          {/* {true && ( */}
          {chatLoading && stream && (
            // <LoadingIndicator
            //   primaryColor={chatbot.primaryColor || "#63CFDE"}
            // />
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
