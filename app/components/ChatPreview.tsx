import { useState, useRef, useEffect } from "react";
import { sendOpenRouterMessageEffect } from "../lib/openrouter.client";
import { Effect } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";
import { cn } from "~/lib/utils";
import { ChatInput, type ChatInputRef } from "./chat/ChatInput";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatHeader } from "./chat/ChatHeader";
import { StreamToggle } from "./chat/StreamToggle";
import { LoadingIndicator } from "./chat/LoadingIndicator";
import type { Chatbot } from "@prisma/client";

export type ChatPreviewProps = {
  chatbot: Chatbot;
};

export default function ChatPreview({ chatbot }: ChatPreviewProps) {
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
  const inputRef = useRef<ChatInputRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, shouldAutoScroll]);

  // Auto-scroll when streaming updates
  useEffect(() => {
    if (stream && chatLoading) {
      scrollToBottom();
    }
  }, [chatMessages, stream, chatLoading]);

  const handleChatSend = async () => {
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
      Effect.runPromise(
        sendOpenRouterMessageEffect({
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
              // Actualiza solo el último mensaje assistant
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
      Effect.runPromise(
        sendOpenRouterMessageEffect({
          model: chatbot.aiModel || DEFAULT_AI_MODEL,
          instructions: chatbot.instructions || "",
          temperature: chatbot.temperature,
          messages: [
            { role: "system", content: chatbot.instructions || "" },
            ...updatedMessages,
          ],
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
    }
  };

  return (
    <main className="bg-brand-500/20 h-full dark:bg-space-800 rounded-lg shadow overflow-hidden px-4">
      <StreamToggle stream={stream} onToggle={setStream} />

      <article
        className={cn(
          "h-[90%]",
          "bg-[#fff]",
          "rounded-3xl",
          "flex flex-col",
          // Aquí cambiamos el ancho del chat
          "overflow-y-auto dark:bg-gray-800 max-w-lg mx-auto"
        )}
      >
        <ChatHeader
          primaryColor={chatbot.primaryColor || "#63CFDE"}
          name={chatbot.name}
        />

        <section
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="pr-4 grow pt-4 overflow-y-auto flex flex-col gap-2"
        >
          {chatMessages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              primaryColor={chatbot.primaryColor || "#63CFDE"}
            />
          ))}
          <div ref={messagesEndRef} />
        </section>

        <section>
          {chatLoading && stream && (
            <LoadingIndicator
              primaryColor={chatbot.primaryColor || "#63CFDE"}
            />
          )}
        </section>

        <ChatInput
          ref={inputRef}
          value={chatInput}
          onChange={setChatInput}
          onSend={handleChatSend}
          disabled={chatLoading}
          error={chatError}
        />
      </article>
    </main>
  );
}
