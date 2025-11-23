import { useState, useRef, useEffect } from "react";
import { cn } from "~/lib/utils";
import type { Chatbot, Integration } from "@prisma/client";
import { ChatInput } from "./chat/ChatInput";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatHeader } from "./chat/ChatHeader";
import { LoadingIndicator } from "./chat/LoadingIndicator";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";

export interface ChatPreviewProps {
  chatbot: Chatbot;
  integrations?: Integration[]; // Integraciones del chatbot
  production?: boolean;
  onClose?: () => void;
  parentDomain?: string | null; // 🔒 SEGURIDAD: Parent domain para validación (Oct 16, 2025)
}

export default function ChatPreview({
  chatbot,
  production,
  onClose,
}: ChatPreviewProps) {
  // 🔑 SESSION PERSISTENCE: Generate or retrieve sessionId from localStorage
  // ✅ FIX: Lazy initialization para evitar race condition
  // ✅ FIX: Incluir chatbotId en sessionId (consistente con WhatsApp)
  const [sessionId] = useState<string>(() => {
    // SSR safety: retornar vacío en servidor
    if (typeof window === "undefined") return "";

    const storageKey = `formmy_session_${chatbot.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      // Si ya existe, verificar que tenga el formato correcto (web_chatbotId_nanoid)
      // Si es formato antiguo (solo nanoid), regenerar
      if (stored.startsWith(`web_${chatbot.id}_`)) {
        return stored;
      }
    }

    // Generar nuevo sessionId con formato: web_chatbotId_nanoid
    const newId = `web_${chatbot.id}_${nanoid()}`;
    localStorage.setItem(storageKey, newId);
    return newId;
  });

  // ✅ PATRÓN CORRECTO: "Last Message Only" con carga de historial
  const { messages, status, sendMessage, error, setMessages } = useChat({
    id: sessionId || undefined, // ✅ AI SDK native session field
    transport: new DefaultChatTransport({
      api: `/chat/vercel/public?chatbotId=${chatbot.id}`,
      // ⬅️ Solo enviar el último mensaje al servidor
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
    onError: (error) => {
      console.error("[ChatPreview] ❌ Error en useChat:", error);
    },
  });

  // ✅ Cargar mensajes históricos al montar el componente
  useEffect(() => {
    if (!sessionId) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(
          `/chat/vercel/public?sessionId=${sessionId}&chatbotId=${chatbot.id}`
        );
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          console.log("[ChatPreview] 📚 Loaded history:", data.messages.length);
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("[ChatPreview] ❌ Error loading history:", error);
      }
    };

    loadHistory();
  }, [sessionId, chatbot.id]);

  useEffect(() => {
    console.log("[ChatPreview] Estado actual:");
    console.log("  - sessionId:", sessionId);
    console.log("  - status:", status);
    console.log("  - messagesCount:", messages.length);
    console.log("  - messages:", messages);
    console.log("  - hasError:", !!error);
    if (error) console.log("  - error:", error);
  }, [status, messages.length, sessionId, error]);
  const [text, setText] = useState("");
  const isStreaming = status !== "ready";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll SOLO si el usuario ya está al final (no interrumpir scroll manual)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    // Solo hacer scroll si el usuario ya estaba cerca del final
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (!isStreaming) {
      inputRef.current?.focus();
    }
  }, [messages, isStreaming]);

  const handleSubmit = () => {
    sendMessage({ text });
    setText("");
  };

  const handleClearConversation = () => {
    // Limpiar mensajes del chat
    setMessages([]);

    // Generar nuevo sessionId
    const storageKey = `formmy_session_${chatbot.id}`;
    const newId = `web_${chatbot.id}_${nanoid()}`;
    localStorage.setItem(storageKey, newId);

    // Recargar la página para aplicar el nuevo sessionId
    window.location.reload();
  };

  return (
    <main
      className={cn("h-full", {
        "bg-chatPattern bg-cover rounded-3xl  pt-6": !production,
      })}
    >
      {/* Stream toggle removed - usando AgentEngine V0 con streaming siempre activo */}

      <article
        className={cn(
          "border border-gray-200",
          "bg-white",
          "flex flex-col",
          "overflow-hidden",
          {
            "h-full w-full": production,
            "h-svh max-h-[600px] mb-6 max-w-lg mx-auto rounded-2xl shadow-2xl":
              !production,
          }
        )}
      >
        <ChatHeader
          primaryColor={chatbot.primaryColor || "#9A99EA"}
          name={chatbot.name}
          avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
          onClear={handleClearConversation}
          showCloseButton={production}
          onClose={onClose}
        />

        <section
          ref={scrollContainerRef}
          className="pr-4 grow pt-4 overflow-y-auto flex flex-col gap-2 "
        >
          <>
            <MessageBubble
              key={"saludo"}
              message={{ role: "assistant", content: chatbot.welcomeMessage }}
              avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
            />
            {messages?.map((message) => {
              console.log("[ChatPreview] Renderizando mensaje:", message);
              return (
                <div key={message.id}>
                  {/* <strong>{message.role}</strong> */}
                  {message.parts?.map((part, idx) => {
                    console.log("[ChatPreview] Renderizando part:", part);
                    switch (part.type) {
                      case "text":
                        return (
                          <MessageBubble
                            key={idx}
                            message={{ role: message.role, content: part.text }}
                            avatarUrl={
                              chatbot.avatarUrl || "/dash/default-ghosty.svg"
                            }
                          />
                        );
                      default:
                        console.warn("[ChatPreview] Tipo de part no soportado:", part.type);
                        return null;
                    }
                  })}
                </div>
              );
            })}
          </>

          <div ref={messagesEndRef} />
        </section>

        <section>
          {isStreaming && (
            <MessageBubble
              role="assistant"
              avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
            >
              <LoadingIndicator />
            </MessageBubble>
          )}
        </section>

        <ChatInput
          ref={inputRef}
          value={text}
          onChange={(value) => {
            setText(value);
          }}
          onSend={handleSubmit}
          disabled={isStreaming}
        />
      </article>
    </main>
  );
}
