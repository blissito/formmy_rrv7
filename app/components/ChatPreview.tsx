import { useState, useRef, useEffect, useCallback } from "react";
import { sendOpenRouterMessageEffect } from "../lib/openrouter.client";
import { Effect } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";
import { cn } from "~/lib/utils";
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
              { role: "system", content: chatbot.instructions || "" },
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
        formData.append("chatbotId", chatbot.id);
        formData.append("message", currentInput);
        formData.append("sessionId", `preview-${chatbot.id}-${Date.now()}`);
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
              { role: "system", content: chatbot.instructions || "" },
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
        formData.append("chatbotId", chatbot.id);
        formData.append("message", currentInput);
        formData.append("sessionId", `preview-${chatbot.id}-${Date.now()}`);
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
